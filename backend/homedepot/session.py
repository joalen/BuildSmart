import gzip
import json
import asyncio
import subprocess
import platform
import logging
import zlib
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)


STORE_FINDER_URL = "https://apionline.homedepot.com/federation-gateway/graphql?opname=storeSearch"
STORE_FINDER_QUERY = """query storeSearch($lat: String, $lng: String, $storeSearchInput: String, $pagesize: String, $storeFeaturesFilter: StoreFeaturesFilter) {
  storeSearch(lat: $lat lng: $lng storeSearchInput: $storeSearchInput pagesize: $pagesize storeFeaturesFilter: $storeFeaturesFilter) {
    stores {
      storeId
      name
      address { street city state postalCode country }
      distance
    }
  }
}"""

class HomeDepotSession:

    def __init__(self):
        self.url = None
        self.headers = None
        self.payload_template = None
        self.playwright = None
        self.browser = None
        self.page = None
        self._xvfb = None
        self._display_ready = False

        # caches for session-context
        self.filter_catalog: dict[str, dict[str, str]] = {}
        self.nearby_stores = {}

    def _get_browser_path(self) -> str:
        system = platform.system()
        if system == "Darwin":
            return "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
        elif system == "Linux":
            return "/usr/bin/brave-browser"
        else:
            return "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe"

    def _ensure_display(self):
        if self._display_ready:
            return  # already started, don't spawn again
        
        if platform.system() == "Linux":
            import os
            self._xvfb = subprocess.Popen(
                ["Xvfb", ":99", "-screen", "0", "1920x1080x24"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            os.environ["DISPLAY"] = ":99"
            import time
            time.sleep(2)
            self._display_ready = True
            logger.info("Xvfb virtual display started")

    async def resolve_zip(self, zip_code: str) -> str | None:
        if zip_code in self.nearby_stores:
            return self.nearby_stores[zip_code]
        
        payload = {
            "operationName": "storeSearch",
            "variables": {
                "lat": "", "lng": "",
                "pagesize": "5",
                "storeSearchInput": zip_code,
                "storeFeaturesFilter": {
                    "applianceShowroom": False,
                    "expandedFlooringShowroom": False,
                    "wiFi": False, "keyCutting": False,
                    "loadNGo": False, "propane": False,
                    "toolRental": False, "penske": False,
                }
            },
            "query": STORE_FINDER_QUERY
        }
        
        result = await self.page.evaluate("""
            async ({ url, payload }) => {
                const resp = await fetch(url, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        "x-experience-name": "header-footer-static",
                        "x-debug": "false",
                        "x-hd-dc": "origin",
                    },
                    body: JSON.stringify(payload)
                });
                return await resp.json();
            }
        """, {"url": STORE_FINDER_URL, "payload": payload})
        
        stores = result["data"]["storeSearch"]["stores"]
        if not stores:
            return None
        
        for store in stores:
            self.nearby_stores[store["address"]["postalCode"]] = store["storeId"]
        
        return stores[0]["storeId"]

    async def init(self):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

        self.url = None
        self.headers = None
        self.payload_template = None
        self._ensure_display()

        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=False,
            executable_path=self._get_browser_path(),
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )
        self.page = await self.browser.new_page()

        def _safe_post_data(request) -> str:
            try:
                return request.post_data or ""
            except Exception:
                pass 

            try:
                raw = request.post_data_buffer # post_data failed, get raw bytes instead
                if not raw:
                    return ""
                
                # try gzip
                try:
                    return gzip.decompress(raw).decode("utf-8")
                except Exception:
                    pass
                
                # try zlib/deflate
                try:
                    return zlib.decompress(raw).decode("utf-8")
                except Exception:
                    pass
                
                # try raw decode with error ignoring as last resort
                return raw.decode("utf-8", errors="ignore")
            
            except Exception:
                return ""
    
        async def handle_route(route, request):
            try: 
                post_data = _safe_post_data(request)

                if "searchModel" in request.url and self.payload_template is None:
                    try:
                        self.url = request.url
                        self.headers = dict(request.headers)
                        self.payload_template = json.loads(post_data)
                        logger.info(f"Session captured from {self.url}")
                    except Exception as e:
                        logger.warning(f"Failed to capture request: {e}")
                
            except Exception as e: 
                logger.warning(f"handle_route error: {e}")
            finally:
                await route.continue_()

        await self.page.route("**/*", handle_route)

        await self.page.goto("https://www.homedepot.com")
        await self.page.wait_for_load_state("domcontentloaded")
        await self.page.wait_for_timeout(2000)

        attempts = 0
        while self.payload_template is None and attempts < 3:
            attempts += 1
            logger.info(f"Navigation attempt {attempts}/3")
            await self.page.goto(
                "https://www.homedepot.com/b/Appliances-Refrigerators-French-Door-Refrigerators/N-5yc1vZc3oo"
            )
            await self.page.wait_for_load_state("load")
            await self.page.evaluate("window.scrollBy(0, 800)")
            await self.page.wait_for_timeout(2000)
            await self.page.evaluate("window.scrollBy(0, 800)")

            for i in range(15):
                if self.payload_template is not None:
                    break
                await self.page.wait_for_timeout(1000)
                logger.debug(f"Waiting for searchModel... [{i+1}/15]")

        if not self.payload_template:
            raise Exception("Failed to capture searchModel session")

        logger.info("Session ready")

    async def close(self):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        if self._xvfb:
            self._xvfb.terminate()
            logger.info("Xvfb terminated")