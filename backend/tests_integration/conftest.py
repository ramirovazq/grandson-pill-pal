"""Pytest configuration and fixtures for integration tests."""

from typing import AsyncGenerator, Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from src.db import Base, get_async_session
from src.main import app

# Use in-memory SQLite for integration tests (shared across connections)
INTEGRATION_TEST_DATABASE_URL = "sqlite+aiosqlite:///file::memory:?cache=shared&uri=true"
INTEGRATION_TEST_SYNC_DATABASE_URL = "sqlite:///file::memory:?cache=shared&uri=true"

# Create test engines with StaticPool to share the same connection
integration_engine = create_async_engine(
    INTEGRATION_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

sync_integration_engine = create_engine(
    INTEGRATION_TEST_SYNC_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


# Enable foreign key constraints for SQLite
@event.listens_for(integration_engine.sync_engine, "connect")
def set_sqlite_pragma_async(dbapi_connection, connection_record):
    """Enable foreign key constraints for SQLite."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


@event.listens_for(sync_integration_engine, "connect")
def set_sqlite_pragma_sync(dbapi_connection, connection_record):
    """Enable foreign key constraints for SQLite."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


integration_async_session_maker = async_sessionmaker(
    integration_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def override_get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Override the database session for integration testing."""
    async with integration_async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest.fixture(scope="class")
def integration_client() -> Generator[TestClient, None, None]:
    """
    Provide a test client with a persistent in-memory SQLite database.
    
    This fixture uses class scope to maintain database state across tests
    within the same class, allowing us to test data persistence in workflows.
    """
    # Setup: Create database tables
    Base.metadata.drop_all(bind=sync_integration_engine)
    Base.metadata.create_all(bind=sync_integration_engine)

    # Override the dependency
    app.dependency_overrides[get_async_session] = override_get_async_session

    with TestClient(app) as test_client:
        yield test_client

    # Cleanup
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=sync_integration_engine)


@pytest.fixture
def client(integration_client: TestClient) -> TestClient:
    """Alias for integration_client for simpler test signatures."""
    return integration_client
