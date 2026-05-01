from homedepot.search import search_products
from homedepot.schema import SearchRequest

def test_sku_in_search_results(hd_session, hd_loop, project_plan):
    for item in project_plan["materials"] + project_plan["tools"]:
        store_id = hd_loop.run_until_complete(hd_session.resolve_zip(item["zip"]))
        request = SearchRequest(keyword=item["sku"], storeId=store_id, pageSize=5)
        response = hd_loop.run_until_complete(search_products(hd_session, request))

        matched = next((p for p in response.products if p.itemId == item["sku"]), None)
        assert matched is not None, f"SKU {item['sku']} not found"