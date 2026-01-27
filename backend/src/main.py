"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

### Features

- **Create prescriptions** with multiple medication items
- **Schedule SMS reminders** to be sent at appropriate times
- **Multi-language support** (English and Spanish)
- **Flexible scheduling** with customizable reminder times

### Getting Started

1. Create a prescription with `POST /api/v1/prescriptions`
2. View reminders with `GET /api/v1/prescriptions/{id}/reminders`
3. Update prescription status with `PATCH /api/v1/prescriptions/{id}/status`

### Authentication

Currently, no authentication is required. Future versions will include API key authentication.
    """,
    openapi_url=f"{settings.api_prefix}/openapi.json",
    docs_url=f"{settings.api_prefix}/docs",
    redoc_url=f"{settings.api_prefix}/redoc",
    openapi_tags=tags_metadata,
    contact={
        "name": "Grandson Pill Pal Support",
        "url": "https://github.com/grandson-pill-pal",
        "email": "support@grandsonpillpal.example.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    swagger_ui_parameters={
        "defaultModelsExpandDepth": -1,  # Hide schemas section by default
        "docExpansion": "list",  # Expand operations list
        "filter": True,  # Enable filtering
        "syntaxHighlight.theme": "monokai",  # Syntax highlighting theme
    },
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
