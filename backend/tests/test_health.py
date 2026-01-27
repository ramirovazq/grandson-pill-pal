"""Tests for health check endpoint."""

from fastapi.testclient import TestClient


class TestHealthCheck:
    """Tests for the health check endpoint."""

    def test_health_check_returns_200(self, client: TestClient) -> None:
        """Health check should return 200 OK."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200

    def test_health_check_returns_healthy_status(self, client: TestClient) -> None:
        """Health check should return healthy status."""
        response = client.get("/api/v1/health")
        data = response.json()
        assert data["status"] == "healthy"

    def test_health_check_includes_timestamp(self, client: TestClient) -> None:
        """Health check should include a timestamp."""
        response = client.get("/api/v1/health")
        data = response.json()
        assert "timestamp" in data
        assert data["timestamp"] is not None

    def test_health_check_includes_version(self, client: TestClient) -> None:
        """Health check should include the API version."""
        response = client.get("/api/v1/health")
        data = response.json()
        assert "version" in data
        assert data["version"] == "1.0.0"
