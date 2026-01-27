"""Prescription-related Pydantic models."""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PrescriptionStatus(str, Enum):
    """Status of a prescription."""

    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ReminderSchedule(BaseModel):
    """Schedule configuration for reminders."""

    times: Optional[list[str]] = Field(
        default=None,
        description="Times of day to send reminders (24h format, e.g., '08:00')",
        examples=[["08:00", "20:00"]],
    )
    days_of_week: Optional[list[int]] = Field(
        default=None,
        description="Days of the week (0=Sunday, 6=Saturday)",
        examples=[[0, 1, 2, 3, 4, 5, 6]],
    )


class PrescriptionItemInput(BaseModel):
    """Input model for creating a prescription item."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Medication instruction text",
        examples=["Take 1 blue pill every morning with food"],
    )
    schedule: Optional[ReminderSchedule] = Field(
        default=None,
        description="Optional custom schedule for this medication",
    )


class PrescriptionItem(BaseModel):
    """A medication item within a prescription."""

    id: UUID = Field(..., description="Unique identifier for this item")
    text: str = Field(..., description="Medication instruction text")
    schedule: Optional[ReminderSchedule] = Field(
        default=None,
        description="Schedule for this medication",
    )


class CreatePrescriptionRequest(BaseModel):
    """Request body for creating a new prescription."""

    phone_number: str = Field(
        ...,
        min_length=10,
        max_length=20,
        description="Phone number to send reminders to (E.164 format recommended)",
        examples=["+15551234567"],
    )
    items: list[PrescriptionItemInput] = Field(
        ...,
        min_length=1,
        max_length=50,
        description="List of medication items",
    )
    language: str = Field(
        default="en",
        pattern="^(en|es)$",
        description="Preferred language for reminder messages",
    )
    timezone: str = Field(
        default="UTC",
        description="Timezone for scheduling reminders",
        examples=["America/New_York"],
    )
    recipient_name: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Name of the person receiving reminders",
        examples=["Grandma Rose"],
    )


class UpdatePrescriptionRequest(BaseModel):
    """Request body for updating a prescription."""

    phone_number: Optional[str] = Field(
        default=None,
        min_length=10,
        max_length=20,
        description="Phone number to send reminders to",
    )
    items: Optional[list[PrescriptionItemInput]] = Field(
        default=None,
        min_length=1,
        max_length=50,
        description="List of medication items (replaces existing items)",
    )
    language: Optional[str] = Field(
        default=None,
        pattern="^(en|es)$",
        description="Preferred language for reminder messages",
    )
    timezone: Optional[str] = Field(
        default=None,
        description="Timezone for scheduling reminders",
    )
    recipient_name: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Name of the person receiving reminders",
    )


class UpdateStatusRequest(BaseModel):
    """Request body for updating prescription status."""

    status: PrescriptionStatus = Field(..., description="New status for the prescription")


class Prescription(BaseModel):
    """A prescription with medication items."""

    id: UUID = Field(..., description="Unique identifier")
    phone_number: str = Field(..., description="Phone number for reminders")
    items: list[PrescriptionItem] = Field(..., description="Medication items")
    language: str = Field(default="en", description="Language for reminders")
    timezone: str = Field(default="UTC", description="Timezone for scheduling")
    recipient_name: Optional[str] = Field(
        default=None, description="Name of the recipient"
    )
    status: PrescriptionStatus = Field(..., description="Current status")
    created_at: datetime = Field(..., description="When the prescription was created")
    updated_at: datetime = Field(..., description="When the prescription was last updated")


class PrescriptionList(BaseModel):
    """Paginated list of prescriptions."""

    prescriptions: list[Prescription] = Field(..., description="List of prescriptions")
    total: int = Field(..., description="Total number of prescriptions matching the query")
    limit: int = Field(..., description="Maximum number of results returned")
    offset: int = Field(..., description="Number of results skipped")
