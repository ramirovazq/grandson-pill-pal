"""Pytest configuration and fixtures."""

from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from src.db import Base, get_async_session
from src.main import app

# Create test engine with file-based SQLite (to work with sync TestClient)
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"
TEST_SYNC_DATABASE_URL = "sqlite:///./test.db"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Sync engine for setup/teardown
sync_engine = create_engine(
    TEST_SYNC_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


# Enable foreign key constraints for SQLite
@event.listens_for(test_engine.sync_engine, "connect")
def set_sqlite_pragma_async(dbapi_connection, connection_record):
    """Enable foreign key constraints for SQLite."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


@event.listens_for(sync_engine, "connect")
def set_sqlite_pragma_sync(dbapi_connection, connection_record):
    """Enable foreign key constraints for SQLite."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


test_async_session_maker = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def override_get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Override the database session for testing."""
    async with test_async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest.fixture(scope="function")
def client() -> Generator[TestClient, None, None]:
    """Provide a test client with a clean database."""
    # Setup: Drop and create tables using sync engine
    Base.metadata.drop_all(bind=sync_engine)
    Base.metadata.create_all(bind=sync_engine)

    # Override the dependency
    app.dependency_overrides[get_async_session] = override_get_async_session

    with TestClient(app) as test_client:
        yield test_client

    # Cleanup
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=sync_engine)


@pytest_asyncio.fixture
async def async_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide an async database session for tests."""
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with test_async_session_maker() as session:
        yield session

    # Drop tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def async_client(async_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide an async test client."""
    app.dependency_overrides[get_async_session] = override_get_async_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def sample_prescription_data() -> dict:
    """Sample data for creating a prescription."""
    return {
        "phone_number": "+15551234567",
        "items": [
            {"text": "Take 1 blue pill every morning with food"},
            {"text": "Take 2 white pills at night before bed"},
        ],
        "language": "en",
        "timezone": "America/New_York",
        "recipient_name": "Grandma Rose",
    }


@pytest.fixture
def created_prescription(client: TestClient, sample_prescription_data: dict) -> dict:
    """Create a prescription and return its data."""
    response = client.post("/api/v1/prescriptions", json=sample_prescription_data)
    assert response.status_code == 201
    return response.json()
