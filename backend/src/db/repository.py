"""Database repository for CRUD operations."""

import json
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import (
    PrescriptionItemModel,
    PrescriptionModel,
    PrescriptionStatus,
    ReminderModel,
    ReminderStatus,
)
from src.models.prescription import (
    CreatePrescriptionRequest,
    Prescription,
    PrescriptionItem,
    PrescriptionList,
    ReminderSchedule,
    UpdatePrescriptionRequest,
)
from src.models.reminder import Reminder, ReminderList


class PrescriptionRepository:
    """Repository for prescription database operations."""

    def __init__(self, session: AsyncSession):
        """Initialize with a database session."""
        self.session = session

    # Conversion helpers

    def _model_to_prescription(self, model: PrescriptionModel) -> Prescription:
        """Convert SQLAlchemy model to Pydantic model."""
        items = [
            PrescriptionItem(
                id=UUID(item.id),
                text=item.text,
                schedule=self._parse_schedule(item.schedule_times, item.schedule_days),
            )
            for item in model.items
        ]

        return Prescription(
            id=UUID(model.id),
            phone_number=model.phone_number,
            items=items,
            language=model.language,
            timezone=model.timezone,
            recipient_name=model.recipient_name,
            status=model.status,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _model_to_reminder(self, model: ReminderModel) -> Reminder:
        """Convert SQLAlchemy reminder model to Pydantic model."""
        return Reminder(
            id=UUID(model.id),
            prescription_id=UUID(model.prescription_id),
            item_id=UUID(model.item_id),
            message=model.message,
            scheduled_at=model.scheduled_at,
            sent_at=model.sent_at,
            status=model.status,
        )

    def _parse_schedule(
        self, times_json: Optional[str], days_json: Optional[str]
    ) -> Optional[ReminderSchedule]:
        """Parse schedule from JSON strings."""
        if not times_json and not days_json:
            return None

        times = json.loads(times_json) if times_json else None
        days = json.loads(days_json) if days_json else None

        if times or days:
            return ReminderSchedule(times=times, days_of_week=days)
        return None

    def _schedule_to_json(
        self, schedule: Optional[ReminderSchedule]
    ) -> tuple[Optional[str], Optional[str]]:
        """Convert schedule to JSON strings."""
        if not schedule:
            return None, None

        times_json = json.dumps(schedule.times) if schedule.times else None
        days_json = json.dumps(schedule.days_of_week) if schedule.days_of_week else None

        return times_json, days_json

    def _generate_reminder_message(
        self, medication_text: str, language: str, recipient_name: Optional[str]
    ) -> str:
        """Generate a friendly reminder message."""
        name = recipient_name or "there"

        if language == "es":
            return f"💊 ¡Hola {name}! Es hora de tu medicina. {medication_text}. ¡Tú puedes! 💪"
        else:
            return f"💊 Hey {name}! Time for your medicine. {medication_text}. You got this! 💪"

    # CRUD operations

    async def create_prescription(
        self, request: CreatePrescriptionRequest
    ) -> Prescription:
        """Create a new prescription with items and reminders."""
        now = datetime.now(timezone.utc)

        # Create prescription model
        prescription_model = PrescriptionModel(
            phone_number=request.phone_number,
            language=request.language,
            timezone=request.timezone,
            recipient_name=request.recipient_name,
            status=PrescriptionStatus.ACTIVE,
            created_at=now,
            updated_at=now,
        )

        # Create item models
        for item in request.items:
            times_json, days_json = self._schedule_to_json(item.schedule)
            item_model = PrescriptionItemModel(
                text=item.text,
                schedule_times=times_json,
                schedule_days=days_json,
            )
            prescription_model.items.append(item_model)

        self.session.add(prescription_model)
        await self.session.flush()  # Get the IDs

        # Create reminders for each item
        for item_model in prescription_model.items:
            for i in range(3):
                reminder = ReminderModel(
                    prescription_id=prescription_model.id,
                    item_id=item_model.id,
                    message=self._generate_reminder_message(
                        item_model.text,
                        prescription_model.language,
                        prescription_model.recipient_name,
                    ),
                    scheduled_at=now + timedelta(hours=8 * (i + 1)),
                    status=ReminderStatus.PENDING,
                )
                self.session.add(reminder)

        await self.session.flush()

        return self._model_to_prescription(prescription_model)

    async def get_prescription(self, prescription_id: UUID) -> Optional[Prescription]:
        """Get a prescription by ID."""
        result = await self.session.execute(
            select(PrescriptionModel).where(
                PrescriptionModel.id == str(prescription_id)
            )
        )
        model = result.scalar_one_or_none()

        if not model:
            return None

        return self._model_to_prescription(model)

    async def list_prescriptions(
        self,
        phone_number: Optional[str] = None,
        status: Optional[PrescriptionStatus] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> PrescriptionList:
        """List prescriptions with optional filters and pagination."""
        # Build query
        query = select(PrescriptionModel)

        if phone_number:
            query = query.where(PrescriptionModel.phone_number == phone_number)
        if status:
            query = query.where(PrescriptionModel.status == status)

        # Get total count
        count_query = select(PrescriptionModel)
        if phone_number:
            count_query = count_query.where(
                PrescriptionModel.phone_number == phone_number
            )
        if status:
            count_query = count_query.where(PrescriptionModel.status == status)

        count_result = await self.session.execute(count_query)
        total = len(count_result.scalars().all())

        # Apply sorting and pagination
        query = query.order_by(PrescriptionModel.created_at.desc())
        query = query.offset(offset).limit(limit)

        result = await self.session.execute(query)
        models = result.scalars().all()

        prescriptions = [self._model_to_prescription(m) for m in models]

        return PrescriptionList(
            prescriptions=prescriptions,
            total=total,
            limit=limit,
            offset=offset,
        )

    async def update_prescription(
        self, prescription_id: UUID, request: UpdatePrescriptionRequest
    ) -> Optional[Prescription]:
        """Update a prescription."""
        result = await self.session.execute(
            select(PrescriptionModel).where(
                PrescriptionModel.id == str(prescription_id)
            )
        )
        model = result.scalar_one_or_none()

        if not model:
            return None

        now = datetime.now(timezone.utc)

        # Update fields
        if request.phone_number is not None:
            model.phone_number = request.phone_number
        if request.language is not None:
            model.language = request.language
        if request.timezone is not None:
            model.timezone = request.timezone
        if request.recipient_name is not None:
            model.recipient_name = request.recipient_name

        # Update items if provided
        if request.items is not None:
            # Delete existing items (cascade will handle reminders)
            for item in list(model.items):  # Use list() to avoid modifying while iterating
                await self.session.delete(item)

            # Flush to ensure items and their reminders are deleted
            await self.session.flush()

            # Clear the items from the model
            model.items.clear()

            # Add new items
            new_items: list[PrescriptionItemModel] = []
            for item in request.items:
                times_json, days_json = self._schedule_to_json(item.schedule)
                item_model = PrescriptionItemModel(
                    prescription_id=model.id,
                    text=item.text,
                    schedule_times=times_json,
                    schedule_days=days_json,
                )
                model.items.append(item_model)
                new_items.append(item_model)

            # Flush to persist the new items and get their IDs
            await self.session.flush()

            # Create new reminders for the new items
            for item_model in new_items:
                for i in range(3):
                    reminder = ReminderModel(
                        prescription_id=model.id,
                        item_id=item_model.id,
                        message=self._generate_reminder_message(
                            item_model.text,
                            model.language,
                            model.recipient_name,
                        ),
                        scheduled_at=now + timedelta(hours=8 * (i + 1)),
                        status=ReminderStatus.PENDING,
                    )
                    self.session.add(reminder)

        model.updated_at = now
        await self.session.flush()

        return self._model_to_prescription(model)

    async def delete_prescription(self, prescription_id: UUID) -> bool:
        """Delete a prescription."""
        result = await self.session.execute(
            select(PrescriptionModel).where(
                PrescriptionModel.id == str(prescription_id)
            )
        )
        model = result.scalar_one_or_none()

        if not model:
            return False

        await self.session.delete(model)
        await self.session.flush()
        return True

    async def update_prescription_status(
        self, prescription_id: UUID, status: PrescriptionStatus
    ) -> Optional[Prescription]:
        """Update a prescription's status."""
        result = await self.session.execute(
            select(PrescriptionModel).where(
                PrescriptionModel.id == str(prescription_id)
            )
        )
        model = result.scalar_one_or_none()

        if not model:
            return None

        model.status = status
        model.updated_at = datetime.now(timezone.utc)

        # Cancel pending reminders if prescription is cancelled or completed
        if status in (PrescriptionStatus.CANCELLED, PrescriptionStatus.COMPLETED):
            reminder_result = await self.session.execute(
                select(ReminderModel).where(
                    ReminderModel.prescription_id == str(prescription_id),
                    ReminderModel.status == ReminderStatus.PENDING,
                )
            )
            reminders = reminder_result.scalars().all()
            for reminder in reminders:
                reminder.status = ReminderStatus.CANCELLED

        await self.session.flush()
        return self._model_to_prescription(model)

    async def get_reminders(
        self, prescription_id: UUID, status: Optional[ReminderStatus] = None
    ) -> Optional[ReminderList]:
        """Get reminders for a prescription."""
        # Check if prescription exists
        result = await self.session.execute(
            select(PrescriptionModel).where(
                PrescriptionModel.id == str(prescription_id)
            )
        )
        model = result.scalar_one_or_none()

        if not model:
            return None

        # Build reminder query
        query = select(ReminderModel).where(
            ReminderModel.prescription_id == str(prescription_id)
        )

        if status:
            query = query.where(ReminderModel.status == status)

        query = query.order_by(ReminderModel.scheduled_at)

        result = await self.session.execute(query)
        reminder_models = result.scalars().all()

        reminders = [self._model_to_reminder(r) for r in reminder_models]

        return ReminderList(reminders=reminders, total=len(reminders))
