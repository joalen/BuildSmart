import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from projectplanner.service import generate_plan
from projectplanner.schema import ProjectRequest
from homedepot.session import HomeDepotSession
from homedepot.search import search_products
from homedepot.schema import SearchRequest, SearchResponse
import traceback
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

logger = logging.getLogger(__name__)
hd_session = HomeDepotSession()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Booting Home Depot session")
    try:
        await asyncio.wait_for(hd_session.init(), timeout=120)
        logger.info("Session booted successfully")
    except asyncio.TimeoutError:
        logger.error("Session init timed out after 120s")
    except Exception as e:
        logger.exception(f"Session boot failed: {e}")
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

@app.post("/homedepot/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    try:
        return await search_products(hd_session, request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "session_ready": hd_session.payload_template is not None
    }