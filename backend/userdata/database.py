from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, Text, DateTime, func
import uuid
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@db:5432/buildsmart")

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, default="anonymous")
    input = Column(Text, nullable=False)
    plan = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SkuEvent(Base):
    __tablename__ = "sku_events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, nullable=False)
    project_type = Column(String)
    sku = Column(String, nullable=False)
    quantity = Column(Integer, default=1)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class SkuAggregate(Base):
    __tablename__ = "sku_aggregates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(String, nullable=False) # example: "2026-02-21"
    sku = Column(String, nullable=False)
    project_type = Column(String)
    frequency = Column(Integer, default=0) # how many sessions saw this SKU
    total_quantity = Column(Integer, default=0) # sum of quantities
    computed_at = Column(DateTime(timezone=True), server_default=func.now())

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)