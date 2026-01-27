"""Health check endpoints."""

from datetime import datetime, timezone

from fastapi import APIRouter

from src.config import settings
from src.models.common import HealthResponse, HealthStatus

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Check if the API is running and healthy",
)
async def health_check() -> HealthResponse:
    """Return the health status of the API."""
    return HealthResponse(
        status=HealthStatus.HEALTHY,
        timestamp=datetime.now(timezone.utc),
        version=settings.app_version,
    )
