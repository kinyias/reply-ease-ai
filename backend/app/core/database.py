from typing import AsyncGenerator
from urllib.parse import urlparse, urlunparse
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


# SQLAlchemy 2.0 Base Class
class Base(DeclarativeBase):
    pass


def get_async_database_url_and_args(url: str):
    connect_args = {}
    parsed = urlparse(url)

    # Convert postgresql:// or postgres:// to postgresql+asyncpg://
    scheme = parsed.scheme
    if scheme in ("postgresql", "postgres"):
        scheme = "postgresql+asyncpg"

    # Handle SSL for cloud databases (Neon, Supabase, Render, AWS RDS)
    is_cloud_db = any(
        domain in parsed.netloc
        for domain in ("neon.tech", "supabase.co", "render.com", "amazonaws.com")
    )
    if is_cloud_db or "sslmode=require" in parsed.query or "ssl=require" in parsed.query:
        connect_args["ssl"] = True

    # Strip incompatible query parameters for asyncpg (e.g. sslmode, channel_binding)
    clean_url = urlunparse((
        scheme,
        parsed.netloc,
        parsed.path,
        "",
        "",
        ""
    ))
    return clean_url, connect_args


database_url, connect_args = get_async_database_url_and_args(settings.DATABASE_URL)

# Async Database Engine
engine = create_async_engine(
    database_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args=connect_args,
)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    class_=AsyncSession,
)


# Dependency to get DB session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
