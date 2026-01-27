"""Pytest configuration and fixtures."""

import pytest
from fastapi.testclient import TestClient

from src.db.mock_db import MockDatabase, reset_db, get_db
from src.main import app


@pytest.fixture
def db() -> MockDatabase:
    """Provide a clean database for each test."""
    reset_db()
    return get_db()


@pytest.fixture
def client(db: MockDatabase) -> TestClient:
    """Provide a test client with a clean database."""
    return TestClient(app)


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
