import sys, os
from unittest.mock import AsyncMock, patch
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import asyncio
import pytest
from homedepot.session import HomeDepotSession
from fastapi.testclient import TestClient
from main import app

@pytest.fixture(scope="session")
def client():
    with patch("main.init_db", new_callable=AsyncMock), \
         patch("main.hd_session.init", new_callable=AsyncMock), \
         patch("main.hd_session.close", new_callable=AsyncMock):
        with TestClient(app) as c:
            yield c

@pytest.fixture(scope="session")
def hd_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
def hd_session(hd_loop):
    session = HomeDepotSession()
    hd_loop.run_until_complete(session.init())
    hd_loop.run_until_complete(session.page.goto("https://www.homedepot.com"))
    hd_loop.run_until_complete(session.page.wait_for_load_state("load"))
    yield session
    hd_loop.run_until_complete(session.close())

@pytest.fixture
def project_plan():
    return {
        "materials": [
            {"name": "32 oz. All Purpose Cleaner Spray 30% Cleaning Vinegar", "sku": "313186760", "price": 8.71, "zip": "75150"},
        ],
        "tools": [
            {"name": "9 in. Heavy Duty 5-Wire Paint Roller Frame", "sku": "100001737", "price": 4.68, "zip": "75150"},
        ]
    }