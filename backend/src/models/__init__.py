"""Pydantic models for the API."""

from src.models.prescription import (
    CreatePrescriptionRequest,
    UpdatePrescriptionRequest,
    Prescription,
    PrescriptionItem,
    PrescriptionItemInput,
    PrescriptionList,
    PrescriptionStatus,
    ReminderSchedule,
    UpdateStatusRequest,
)
from src.models.reminder import Reminder, ReminderStatus, ReminderList
from src.models.common import ErrorResponse, ValidationErrorResponse, HealthResponse

__all__ = [
    # Prescription models
    "CreatePrescriptionRequest",
    "UpdatePrescriptionRequest",
    "Prescription",
    "PrescriptionItem",
    "PrescriptionItemInput",
    "PrescriptionList",
    "PrescriptionStatus",
    "ReminderSchedule",
    "UpdateStatusRequest",
    # Reminder models
    "Reminder",
    "ReminderStatus",
    "ReminderList",
    # Common models
    "ErrorResponse",
    "ValidationErrorResponse",
    "HealthResponse",
]
