"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.routers import health_router, prescriptions_router

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    API for Grandson Pill Pal - A medication reminder service for helping loved ones 
    (especially grandparents) remember to take their pills on time.
    
    The API allows creating prescriptions with medication items and scheduling
    SMS reminders to be sent to a specified phone number.
    """,
    openapi_url=f"{settings.api_prefix}/openapi.json",
    docs_url=f"{settings.api_prefix}/docs",
    redoc_url=f"{settings.api_prefix}/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(prescriptions_router, prefix=settings.api_prefix)


@app.get("/", include_in_schema=False)
async def root() -> dict:
    """Root endpoint - redirects to API docs."""
    return {
        "message": "Welcome to Grandson Pill Pal API",
        "docs": f"{settings.api_prefix}/docs",
        "version": settings.app_version,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )
