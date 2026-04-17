import json
import asyncio
import subprocess
import platform
import logging
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)

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

        async def handle_route(route, request):
            if "searchModel" in request.url and self.payload_template is None:
                try:
                    self.url = request.url
                    self.headers = dict(request.headers)
                    self.payload_template = json.loads(request.post_data)
                    logger.info(f"Session captured from {self.url}")
                except Exception as e:
                    logger.warning(f"Failed to capture request: {e}")
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