import asyncio
import sys
import os

from homedepot.session import HomeDepotSession
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import psycopg
import pytest
from contextlib import asynccontextmanager
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from fastapi.testclient import TestClient
import userdata.database as db_module
import main

DB_URL = "postgresql://postgres:postgres@db:5432/buildsmart"
ASYNC_DB_URL = "postgresql+asyncpg://postgres:postgres@db:5432/buildsmart"


@asynccontextmanager
async def mock_lifespan(app):
    await db_module.init_db()
    yield


@pytest.fixture
def client():
    # NullPool to have no connection reuse across threads
    engine = create_async_engine(ASYNC_DB_URL, poolclass=NullPool)
    factory = async_sessionmaker(engine, expire_on_commit=False)

    db_module.engine = engine
    db_module.AsyncSessionLocal = factory
    main.AsyncSessionLocal = factory
    main.app.router.lifespan_context = mock_lifespan

    with TestClient(main.app) as c:
        yield c


@pytest.fixture(autouse=True)
def clean_tables():
    yield
    with psycopg.connect(DB_URL, autocommit=True) as conn:
        conn.execute("TRUNCATE sku_events, sku_aggregates RESTART IDENTITY CASCADE")

@pytest.fixture(scope="session")
def hd_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
def hd_session(hd_loop):
    session = HomeDepotSession()
    hd_loop.run_until_complete(session.init())
    hd_loop.run_until_complete(session.page.goto("https://www.homedepot.com", wait_until="domcontentloaded"))
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