import re
import json
from homedepot.session import HomeDepotSession
from homedepot.schema import SearchRequest, SearchResponse, Product
import logging

logger = logging.getLogger(__name__)

def build_nav_param(base_nav: str, selected_keys: list[str]) -> str:
    """
    base_nav: e.g. "N-5yc1vZc8d3" (category)
    selected_keys: refinementKeys from filter_catalog
    """
    if not selected_keys:
        return base_nav
    
    base = base_nav.lstrip("N-")
    combined = "Z".join([base] + selected_keys)
    return f"N-{combined}"

def _parse_products(raw_products: list) -> list[Product]:
    products = []
    for p in raw_products:
        identifiers = p.get("identifiers", {})
        pricing = p.get("pricing") or {}
        images = p.get("media", {}).get("images", [])
        image_url = images[0].get("url").replace("<SIZE>", "300") if images else None
        canonical = identifiers.get("canonicalUrl", "")

        fulfillment = _parse_fulfillment(p)
        bopis = fulfillment.get("bopis", {})

        products.append(Product(
            itemId=p.get("itemId"),
            brand=identifiers.get("brandName"),
            name=identifiers.get("productLabel"),
            price=pricing.get("value"),
            image=image_url,
            url=f"https://www.homedepot.com{canonical}" if canonical else None,
            in_stock=bopis.get("isInStock", False),
            store_name=bopis.get("storeName"),
            quantity=bopis.get("quantity"),
        ))

    return products

def _parse_filter_catalog(dimensions: list) -> dict[str, dict[str, str]]:
    return {
        dim["label"]: {
            r["label"]: r["refinementKey"]
            for r in dim["refinements"]
            if r.get("refinementKey")
        }
        for dim in dimensions
    }

def _parse_fulfillment(product: dict) -> dict:
    options = product.get("fulfillment", {}).get("fulfillmentOptions") or []
    result = {}
    for option in options:
        for service in option.get("services", []):
            for location in service.get("locations", []):
                inventory = location.get("inventory", {})
                result[service["type"]] = {
                    "storeName": location.get("storeName"),
                    "locationId": location.get("locationId"),
                    "quantity": inventory.get("quantity"),
                    "isInStock": inventory.get("isInStock"),
                    "deliveryTimeline": service.get("deliveryTimeline"),
                }
    return result

async def search_products(
    session: HomeDepotSession,
    request: SearchRequest,
    nav_param: str = "",
    _redirected: bool = False
) -> SearchResponse:

    payload = json.loads(json.dumps(session.payload_template))
    payload["variables"]["keyword"] = request.keyword
    payload["variables"]["navParam"] = nav_param
    payload["variables"]["storeId"] = request.storeId
    payload["variables"]["startIndex"] = 0
    payload["variables"]["pageSize"] = request.pageSize
    payload["variables"]["additionalSearchParams"]["deliveryZip"] = request.zipCode or "75150"

    # Fire from inside Brave — bypasses Akamai completely
    result = await session.page.evaluate("""
        async ({ url, payload }) => {
            const resp = await fetch(url, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-experience-name": "browse-desktop",
                    "x-debug": "false",
                    "x-hd-dc": "origin",
                },
                body: JSON.stringify(payload)
            });
            const status = resp.status;
            const data = await resp.json();
            return { status, data };
        }
    """, {"url": session.url, "payload": payload})

    status = result["status"]
    data = result["data"]

    if status not in (200, 206):
        logger.error(f"Search failed with status {status}")
        return SearchResponse(keyword=request.keyword, products=[], total=0)

    gql_data = data.get("data") or {}
    search_model = gql_data.get("searchModel")
    
    if search_model is None:
        errors = data.get("errors")
        logger.error(f"searchModel missing from response. Errors: {errors}. Keys: {list(gql_data.keys())}")
        return SearchResponse(keyword=request.keyword, products=[], total=0)
    
    session.filter_catalog = _parse_filter_catalog(
        search_model.get("dimensions", [])
    )

    stores_meta = (search_model.get("metadata") or {}).get("stores") or {}
    for store in stores_meta.get("nearByStores", []):
        postal = store["address"]["postalCode"]
        session.nearby_stores[postal] = store["storeId"]

    anchor_zip = stores_meta.get("address", {}).get("postalCode")
    anchor_id = stores_meta.get("storeId")
    if anchor_zip and anchor_id:
        session.nearby_stores[anchor_zip] = anchor_id

    redirect = (search_model.get("metadata") or {}).get("searchRedirect")
    if redirect and not _redirected:
        match = re.search(r'N-(\w+)', redirect)
        if match:
            logger.debug(f"Redirecting to navParam: N-{match.group(1)}")
            return await search_products(
                session,
                request,
                nav_param=f"N-{match.group(1)}",
                _redirected=True
            )

    raw_products = search_model.get("products") or []
    total = (search_model.get("searchReport") or {}).get("totalProducts")

    return SearchResponse(
        keyword=request.keyword,
        products=_parse_products(raw_products),
        total=total,
    )

async def find_swap(
    session: HomeDepotSession,
    oos_product: Product,
    store_id: str,
    base_nav: str,
) -> Product | None:
    nav = build_nav_param(base_nav, ["1z175a5"])
    results = await search_products(
        session,
        SearchRequest(keyword=oos_product.name.split()[0], storeId=store_id),
        nav_param=nav
    )
    
    candidates = [
        p for p in results.products
        if p.itemId != oos_product.itemId
        and p.in_stock
        and p.price is not None
        and oos_product.price is not None
        and abs(p.price - oos_product.price) / oos_product.price <= 0.20
    ]
    
    if not candidates:
        return None
    
    # return closest price match
    return min(candidates, key=lambda p: abs(p.price - oos_product.price))