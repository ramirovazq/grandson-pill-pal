"""SQLAlchemy database models."""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.database import Base


class PrescriptionStatus(str, PyEnum):
    """Status of a prescription."""

    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ReminderStatus(str, PyEnum):
    """Status of a reminder."""

    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"


def generate_uuid() -> str:
    """Generate a new UUID as a string."""
    return str(uuid.uuid4())


def utc_now() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)


class PrescriptionModel(Base):
    """SQLAlchemy model for prescriptions."""

    __tablename__ = "prescriptions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    language: Mapped[str] = mapped_column(String(5), nullable=False, default="en")
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, default="UTC")
    recipient_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(PrescriptionStatus),
        nullable=False,
        default=PrescriptionStatus.ACTIVE,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    # Relationships
    items: Mapped[list["PrescriptionItemModel"]] = relationship(
        "PrescriptionItemModel",
        back_populates="prescription",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    reminders: Mapped[list["ReminderModel"]] = relationship(
        "ReminderModel",
        back_populates="prescription",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Prescription(id={self.id}, phone={self.phone_number}, status={self.status})>"


class ItemType(str, PyEnum):
    """Type of prescription item."""

    MEDICATION = "medication"
    FOOD = "food"
    PROCEDURE = "procedure"


class PrescriptionItemModel(Base):
    """SQLAlchemy model for prescription items."""

    __tablename__ = "prescription_items"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )
    prescription_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("prescriptions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Basic text field (legacy, kept for backwards compatibility)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    
    # New detailed fields
    item_type: Mapped[Optional[str]] = mapped_column(
        Enum(ItemType), nullable=True, default=ItemType.MEDICATION
    )
    item_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    item_name_complete: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    pills_per_dose: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    doses_per_day: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    treatment_duration_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_pills_required: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    raw_prescription_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    requires_human_review: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, default=False)
    
    # Schedule fields
    schedule_times: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # JSON string of times
    schedule_days: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # JSON string of days

    # Relationships
    prescription: Mapped["PrescriptionModel"] = relationship(
        "PrescriptionModel", back_populates="items"
    )
    reminders: Mapped[list["ReminderModel"]] = relationship(
        "ReminderModel",
        back_populates="item",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<PrescriptionItem(id={self.id}, name={self.item_name or self.text[:30]}...)>"


class ReminderModel(Base):
    """SQLAlchemy model for reminders."""

    __tablename__ = "reminders"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )
    prescription_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("prescriptions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("prescription_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        Enum(ReminderStatus),
        nullable=False,
        default=ReminderStatus.PENDING,
        index=True,
    )

    # Relationships
    prescription: Mapped["PrescriptionModel"] = relationship(
        "PrescriptionModel", back_populates="reminders"
    )
    item: Mapped["PrescriptionItemModel"] = relationship(
        "PrescriptionItemModel", back_populates="reminders"
    )

    def __repr__(self) -> str:
        return f"<Reminder(id={self.id}, status={self.status})>"
