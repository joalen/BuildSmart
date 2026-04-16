import re
import json
from homedepot.session import HomeDepotSession
from homedepot.schema import SearchRequest, SearchResponse, Product
import logging

logger = logging.getLogger(__name__)

def _parse_products(raw_products: list) -> list[Product]:
    products = []
    for p in raw_products:
        identifiers = p.get("identifiers", {})
        pricing = p.get("pricing") or {}
        images = p.get("media", {}).get("images", [])
        image_url = images[0].get("url").replace("<SIZE>", "300") if images else None
        canonical = identifiers.get("canonicalUrl", "")

        products.append(Product(
            itemId=p.get("itemId"),
            brand=identifiers.get("brandName"),
            name=identifiers.get("productLabel"),
            price=pricing.get("value"),
            image=image_url,
            url=f"https://www.homedepot.com{canonical}" if canonical else None,
        ))
    return products


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

    search_model = data["data"]["searchModel"]

    redirect = search_model["metadata"].get("searchRedirect")
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
    total = search_model.get("searchReport", {}).get("totalProducts")

    return SearchResponse(
        keyword=request.keyword,
        products=_parse_products(raw_products),
        total=total,
    )