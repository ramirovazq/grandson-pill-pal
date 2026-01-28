"""FastAPI application entry point."""

from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

from src.config import settings
from src.db import create_db_and_tables
from src.routers import health_router, prescriptions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - runs on startup and shutdown."""
    # Startup: Create database tables
    await create_db_and_tables()
    yield
    # Shutdown: Cleanup (nothing needed for now)

# OpenAPI tags metadata for Swagger documentation
tags_metadata = [
    {
        "name": "Health",
        "description": "Health check endpoints to verify API status",
    },
    {
        "name": "Prescriptions",
        "description": "Manage prescriptions with medication items. "
        "Create, read, update, and delete prescriptions.",
    },
    {
        "name": "Reminders",
        "description": "View and manage scheduled SMS reminders for prescriptions.",
    },
]

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
    description="""
## Grandson Pill Pal API

A medication reminder service for helping loved ones (especially grandparents) 
remember to take their pills on time.
    """,
    openapi_url=f"{settings.api_prefix}/openapi.json",
    docs_url=f"{settings.api_prefix}/docs",
    redoc_url=f"{settings.api_prefix}/redoc",
    openapi_tags=tags_metadata,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(prescriptions_router, prefix=settings.api_prefix)


# Serve Frontend (Static Files)
# Only if STATIC_DIR environment variable is set (used in monolithic Docker container)
static_dir = os.getenv("STATIC_DIR")

if static_dir and os.path.isdir(static_dir):
    # Mount assets (JS, CSS, Images)
    # Vite puts assets in /assets, so we mount it there
    app.mount("/assets", StaticFiles(directory=f"{static_dir}/assets"), name="assets")
    
    # Catch-all route for SPA (Single Page Application)
    # This ensures that any route not matched by API returns index.html
    # so React Router can handle it on the client side.
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Allow requests to API docs/openapi to pass through if not caught above
        # (Though API routes are checked first by FastAPI)
        
        # Determine if we should serve index.html
        # Note: API routes are defined above, so they take precedence.
        
        # Serve index.html
        return FileResponse(f"{static_dir}/index.html")

else:
    # Development mode (or standalone backend): Root redirects to docs
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
