import asyncio
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json as json_lib
from sqlalchemy import select

from projectplanner.service import generate_plan
from projectplanner.schema import ProjectRequest
from homedepot.recommendations import get_recs
from homedepot.session import HomeDepotSession
from homedepot.search import build_nav_param, find_swap, search_products
from homedepot.schema import FilteredSearchRequest, SearchRequest, SearchResponse, RecsRequest, SwapRequest
from userdata.database import init_db, AsyncSessionLocal, Project, SkuEvent


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

logger = logging.getLogger(__name__)
hd_session = HomeDepotSession()
session_error: str | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing user database")
    await init_db()

    global session_error
    logger.info("Booting Home Depot session")
    try:
        await asyncio.wait_for(hd_session.init(), timeout=120)
        logger.info("Session booted successfully")
    except asyncio.TimeoutError:
        session_error = "Session init timed out after 120s"
        logger.error(session_error)
    except Exception as e:
        session_error = f"Session boot failed: {e}"
        logger.exception(session_error)
    yield
    logger.info("Shutting down")
    await hd_session.close()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate-plan")
def generate(request: ProjectRequest):
    return generate_plan(request.input)

""" 
All Home Depot endpoints are here
"""
@app.post("/homedepot/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    try:
        return await search_products(hd_session, request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/homedepot/recommendations")
async def recommendations(request: RecsRequest):
    try:
        return await get_recs(hd_session, request.item_id, request.store_id, request.zip_code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/homedepot/filters")
async def get_filters():
    if not hd_session.filter_catalog:
        raise HTTPException(status_code=503, detail="Session not ready")
    return hd_session.filter_catalog

@app.post("/homedepot/item")
async def get_item(request: dict):
    item_id = request.get("itemId")
    store_id = request.get("storeId", "550")
    result = await search_products(
        hd_session,
        SearchRequest(keyword=item_id, storeId=store_id),
    )
    match = next((p for p in result.products if p.itemId == item_id), None)
    return match or {}

@app.post("/homedepot/search/filtered", response_model=SearchResponse)
async def search_filtered(request: FilteredSearchRequest):
    try:
        store_id = request.storeId
        if request.zipCode:
            resolved = await hd_session.resolve_zip(request.zipCode)
            if resolved:
                store_id = resolved
        
        if not store_id:
            raise HTTPException(status_code=400, detail="No storeId and could not resolve zip")

        nav = build_nav_param(request.base_nav, request.filter_keys)
        search_req = SearchRequest(
            keyword=request.keyword,
            storeId=store_id,
            zipCode=request.zipCode,
            pageSize=request.pageSize,
        )
        return await search_products(hd_session, search_req, nav_param=nav)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/homedepot/search/with-swaps")
async def search_with_swaps(request: SwapRequest):
    store_id = request.storeId
    if request.zipCode:
        resolved = await hd_session.resolve_zip(request.zipCode)
        if resolved:
            store_id = resolved
    
    if not store_id:
        raise HTTPException(status_code=400, detail="Could not resolve store")
    
    nav = build_nav_param(request.base_nav, request.filter_keys)
    results = await search_products(
        hd_session,
        SearchRequest(keyword=request.keyword, storeId=store_id),
        nav_param=nav
    )
    
    # find OOS products and get swaps concurrently
    oos = [p for p in results.products if not p.in_stock]  # needs in_stock on Product
    swaps = await asyncio.gather(*[
        find_swap(hd_session, p, store_id, request.base_nav)
        for p in oos
    ])
    
    return {
        "products": results.products,
        "total": results.total,
        "swaps": {
            oos[i].itemId: swaps[i] 
            for i in range(len(oos)) 
            if swaps[i] is not None
        }
    }

@app.post("/homedepot/nearby-stores")
async def nearby_stores(request: dict):
    zip_code = request.get("zipCode")
    if not zip_code:
        raise HTTPException(status_code=400, detail="zipCode required")
    try:
        stores = await hd_session.get_nearby_stores(zip_code)
        return stores
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

""" 
Projects endpoint
"""
@app.post("/projects")
async def save_project(request: dict):
    async with AsyncSessionLocal() as session:
        project = Project(
            input=request["input"],
            plan=json_lib.dumps(request["plan"])
        )
        session.add(project)
        await session.commit()
        return {"id": project.id}

@app.get("/projects")
async def list_projects():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Project).order_by(Project.created_at.desc()).limit(20)
        )
        projects = result.scalars().all()
        return [
            {
                "id": p.id,
                "input": p.input,
                "plan": json_lib.loads(p.plan),
                "created_at": p.created_at
            }
            for p in projects
        ]

@app.get("/projects/{project_id}")
async def get_project(project_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Project).where(Project.id == project_id)
        )
        p = result.scalar_one_or_none()
        if not p:
            raise HTTPException(status_code=404, detail="Project not found")
        return {
            "id": p.id,
            "input": p.input,
            "plan": json_lib.loads(p.plan),
            "created_at": p.created_at
        }

""" 
Events endpoints
"""

@app.post("/events/sku")
async def log_sku_event(request: dict):
    async with AsyncSessionLocal() as session:
        event = SkuEvent(
            session_id=request["session_id"],
            project_type=request.get("project_type"),
            sku=request["sku"],
            quantity=request.get("quantity", 1),
        )
        session.add(event)
        await session.commit()
        return {"ok": True}

""" 
Universal endpoints
"""

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "session_ready": hd_session.payload_template is not None,
        "session_error": session_error,
    }