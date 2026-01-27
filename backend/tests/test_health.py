"""Tests for health check and documentation endpoints."""

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


class TestDocumentation:
    """Tests for API documentation endpoints (Swagger/OpenAPI)."""

    def test_openapi_json_available(self, client: TestClient) -> None:
        """OpenAPI JSON spec should be available."""
        response = client.get("/api/v1/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "info" in data
        assert "paths" in data

    def test_openapi_includes_api_info(self, client: TestClient) -> None:
        """OpenAPI spec should include API info."""
        response = client.get("/api/v1/openapi.json")
        data = response.json()
        assert data["info"]["title"] == "Grandson Pill Pal API"
        assert "version" in data["info"]
        assert "description" in data["info"]

    def test_openapi_includes_contact(self, client: TestClient) -> None:
        """OpenAPI spec should include contact info."""
        response = client.get("/api/v1/openapi.json")
        data = response.json()
        assert "contact" in data["info"]
        assert "name" in data["info"]["contact"]

    def test_openapi_includes_license(self, client: TestClient) -> None:
        """OpenAPI spec should include license info."""
        response = client.get("/api/v1/openapi.json")
        data = response.json()
        assert "license" in data["info"]
        assert data["info"]["license"]["name"] == "MIT"

    def test_openapi_includes_tags(self, client: TestClient) -> None:
        """OpenAPI spec should include tags."""
        response = client.get("/api/v1/openapi.json")
        data = response.json()
        assert "tags" in data
        tag_names = [tag["name"] for tag in data["tags"]]
        assert "Health" in tag_names
        assert "Prescriptions" in tag_names
        assert "Reminders" in tag_names

    def test_swagger_ui_available(self, client: TestClient) -> None:
        """Swagger UI should be available."""
        response = client.get("/api/v1/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

    def test_redoc_available(self, client: TestClient) -> None:
        """ReDoc should be available."""
        response = client.get("/api/v1/redoc")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

    def test_root_endpoint_returns_docs_link(self, client: TestClient) -> None:
        """Root endpoint should return link to docs."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "docs" in data
        assert "/api/v1/docs" in data["docs"]
