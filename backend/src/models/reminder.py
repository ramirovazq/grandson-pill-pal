"""Reminder-related Pydantic models."""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ReminderStatus(str, Enum):
    """Status of a reminder."""

    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Reminder(BaseModel):
    """A scheduled reminder."""

    id: UUID = Field(..., description="Unique identifier")
    prescription_id: UUID = Field(..., description="ID of the associated prescription")
    item_id: UUID = Field(..., description="ID of the associated prescription item")
    message: Optional[str] = Field(
        default=None,
        description="The reminder message that was/will be sent",
        examples=["💊 Hey there! Time for your morning medicine! Take 1 blue pill with food. You got this! 💪"],
    )
    scheduled_at: datetime = Field(
        ..., description="When the reminder is/was scheduled to be sent"
    )
    sent_at: Optional[datetime] = Field(
        default=None, description="When the reminder was actually sent"
    )
    status: ReminderStatus = Field(..., description="Current status of the reminder")


class ReminderList(BaseModel):
    """List of reminders for a prescription."""

    reminders: list[Reminder] = Field(..., description="List of reminders")
    total: int = Field(..., description="Total number of reminders")
