"""Common Pydantic models used across the API."""

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class HealthStatus(str, Enum):
    """Health status of the service."""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class HealthResponse(BaseModel):
    """Health check response."""

    status: HealthStatus = Field(..., description="Current health status")
    timestamp: datetime = Field(..., description="Current server time")
    version: Optional[str] = Field(default=None, description="API version")


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str = Field(..., description="Error code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict[str, Any]] = Field(
        default=None, description="Additional error details"
    )


class ValidationErrorDetail(BaseModel):
    """Detail of a validation error."""

    field: str = Field(..., description="Field that failed validation")
    message: str = Field(..., description="Validation error message")
    code: Optional[str] = Field(default=None, description="Error code")


class ValidationErrorResponse(BaseModel):
    """Validation error response."""

    error: str = Field(default="validation_error", description="Error code")
    message: str = Field(
        default="Request validation failed", description="Error message"
    )
    details: list[ValidationErrorDetail] = Field(
        ..., description="List of validation errors"
    )
