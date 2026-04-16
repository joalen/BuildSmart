import json
import asyncio
import logging
import re
from dataclasses import dataclass

from homedepot.session import HomeDepotSession

logger = logging.getLogger(__name__)

# strategies that show us real purchase data rather than views
FBT_STRATEGIES = {
    "fbt-aggregator-store-current-year-symphony-strategy",
    "fbt-aggregator-online-current-year-symphony-strategy",
    "fbt-aggregator-store-52w-symphony-strategy",
}

RECS_QUERY = """
query recs($anchorId: String!, $apiName: String!, $storeId: String,
           $maxResults: String, $appId: String,
           $key: String, $isBrandPricingPolicyCompliant: Boolean) {
  recs(anchorId: $anchorId, apiName: $apiName, storeId: $storeId,
       appId: $appId, key: $key, maxResults: $maxResults,
       isBrandPricingPolicyCompliant: $isBrandPricingPolicyCompliant) {
    metadata { apiName modelName __typename }
    products {
      category
      strategy
      score
      product(dataSource: "product") {
        itemId
        identifiers { productLabel brandName canonicalUrl __typename }
        pricing(storeId: $storeId,
                isBrandPricingPolicyCompliant: $isBrandPricingPolicyCompliant) {
          value __typename
        }
        media { images { url __typename } __typename }
        __typename
      }
      __typename
    }
    __typename
  }
}
"""
 
 
@dataclass
class RecProduct:
    item_id: str
    category: str
    strategy: str
    score: float
    name: str | None
    price: float | None
    image: str | None
    url: str | None
    is_fbt: bool # only if backed up by actual purchases made 

def _parse_recs(data: dict, fbt_only: bool = False) -> list[RecProduct]:
    products = []
    for p in data.get("data", {}).get("recs", {}).get("products", []):
        strategy = p.get("strategy", "")
        is_fbt = strategy in FBT_STRATEGIES
        if fbt_only and not is_fbt:
            continue
 
        prod = p.get("product") or {}
        identifiers = prod.get("identifiers") or {}
        pricing = prod.get("pricing") or {}
        images = prod.get("media", {}).get("images", [])
        image_url = images[0].get("url", "").replace("<SIZE>", "300") if images else None
        canonical = identifiers.get("canonicalUrl", "")
 
        products.append(RecProduct(
            item_id=prod.get("itemId", ""),
            category=p.get("category", ""),
            strategy=strategy,
            score=float(p.get("score") or 0),
            name=identifiers.get("productLabel"),
            price=pricing.get("value"),
            image=image_url,
            url=f"https://www.homedepot.com{canonical}" if canonical else None,
            is_fbt=is_fbt,
        ))
    return products

async def get_recs(session: HomeDepotSession, item_id: str, store_id: str = None, zip_code: str = None, max_results: int = 18, fbt_only: bool = True, api_name: str = "brand_based_collection") -> list[RecProduct]:
    """ 
    Fetches recommendations for a particular Home Depot item

    Args:
        session:     active HomeDepotSession (must be initialised)
        item_id:     HD item ID of the anchor product
        store_id:    HD store ID (falls back to session default)
        zip_code:    delivery zip (falls back to session default)
        max_results: how many recs to fetch (max 18)
        fbt_only:    if True, only return FBT-strategy products
        api_name:    HD apiName param; "pip_bundle" gets FBT data on PDPs
    
    Returns:
        List of RecProduct sorted by score descending.
    """

    payload = {
        "operationName": "recs",
        "variables": {
            "anchorId": str(item_id),
            "apiName": api_name,
            "appId": "desktop",
            "storeId": store_id or session.payload_template["variables"].get("storeId", "121"),
            "zipCode": zip_code or "75150",
            "maxResults": str(max_results),
            "key": "aGAQFG4j6QtVTSWqujfFYWeIU6BR5Mee",
            "isBrandPricingPolicyCompliant": False,
            "skipInstallServices": True,
            "skipFavoriteCount": True,
        },
        "query": RECS_QUERY,
    }

    result = await session.page.evaluate("""
        async ({ url, payload }) => {
            const resp = await fetch(url, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-experience-name": "fusion-gm-pip-desktop",
                    "x-debug": "false",
                    "x-hd-dc": "origin",
                },
                body: JSON.stringify(payload)
            });
            return { status: resp.status, data: await resp.json() };
        }
    """, {"url": "https://apionline.homedepot.com/federation-gateway/graphql?opname=recs",
          "payload": payload})
 
    if result["status"] not in (200, 206):
        logger.error(f"recs failed for itemId={item_id}: HTTP {result['status']}")
        return []
    
    recs = _parse_recs(result["data"], fbt_only=fbt_only)
    recs.sort(key=lambda r: r.score, reverse=True)
    logger.debug(f"itemId={item_id}: {len(recs)} recs ({sum(r.is_fbt for r in recs)} FBT)")
    return recs

def _slugify(category: str) -> str:
    """Turn 'Paint Roller Extension Poles' -> 'paint_roller_extension_poles'"""
    return re.sub(r"[^a-z0-9]+", "_", category.lower()).strip("_")

async def seed_attach_rate_from_hd(session, engine, seed_item_ids: list[str], store_id: str = None, zip_code: str = None, delay_ms: int = 800):
    """ 
    
    For each seed itemId, fetch HD's FBT recommendations and record them as baskets in the attach_rate engine.
    
    Each HD product page + its FBT results = one "basket":
        anchor_category + [fbt_category_1, fbt_category_2, ...] → record_basket()
    
    Args:
        session:        active HomeDepotSession
        engine:         AttachRateEngine instance
        seed_item_ids:  list of HD itemIds to use as anchors
        store_id:       HD store (optional)
        zip_code:       zip for local inventory (optional)
        delay_ms:       politeness delay between requests (ms)
    """

    total_baskets = 0
    total_skipped = 0
 
    for item_id in seed_item_ids:
        recs = await get_recs(
            session, item_id,
            store_id=store_id,
            zip_code=zip_code,
            fbt_only=True,
        )

        if not recs:
            logger.debug(f"No FBT recs for {item_id}, skipping")
            total_skipped += 1
            continue

        basket_categories = [_slugify(r.category) for r in recs if r.category] # synthesizing anchor cats

        if basket_categories:
            engine.record_basket(
                basket_id=f"hd_{item_id}",
                categories=basket_categories,
            )
            total_baskets += 1
            logger.info(
                f"Seeded hd_{item_id}: {len(basket_categories)} categories "
                f"(top: {basket_categories[0]})"
            )
 
        await asyncio.sleep(delay_ms / 1000)

    logger.info(
        f"Seeding complete — {total_baskets} baskets recorded, "
        f"{total_skipped} skipped (no FBT data)"
    )

    return total_baskets