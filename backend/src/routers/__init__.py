"""API routers."""

from src.routers.health import router as health_router
from src.routers.prescriptions import router as prescriptions_router

__all__ = ["health_router", "prescriptions_router"]
