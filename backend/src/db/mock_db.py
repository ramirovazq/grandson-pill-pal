"""Mock database for development and testing."""

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID, uuid4

from src.models.prescription import (
    CreatePrescriptionRequest,
    Prescription,
    PrescriptionItem,
    PrescriptionStatus,
    UpdatePrescriptionRequest,
)
from src.models.reminder import Reminder, ReminderStatus


class MockDatabase:
    """
    In-memory mock database for prescriptions and reminders.

    This will be replaced with a real database implementation later.
    """

    def __init__(self) -> None:
        """Initialize empty collections."""
        self._prescriptions: dict[UUID, Prescription] = {}
        self._reminders: dict[UUID, list[Reminder]] = {}  # prescription_id -> reminders

    def clear(self) -> None:
        """Clear all data (useful for testing)."""
        self._prescriptions.clear()
        self._reminders.clear()

    # Prescription operations

    def create_prescription(self, request: CreatePrescriptionRequest) -> Prescription:
        """Create a new prescription."""
        now = datetime.now(timezone.utc)
        prescription_id = uuid4()

        # Convert input items to prescription items with IDs
        items = [
            PrescriptionItem(
                id=uuid4(),
                text=item.text,
                schedule=item.schedule,
            )
            for item in request.items
        ]

        prescription = Prescription(
            id=prescription_id,
            phone_number=request.phone_number,
            items=items,
            language=request.language,
            timezone=request.timezone,
            recipient_name=request.recipient_name,
            status=PrescriptionStatus.ACTIVE,
            created_at=now,
            updated_at=now,
        )

        self._prescriptions[prescription_id] = prescription

        # Create mock reminders for each item
        self._create_mock_reminders(prescription)

        return prescription

    def get_prescription(self, prescription_id: UUID) -> Optional[Prescription]:
        """Get a prescription by ID."""
        return self._prescriptions.get(prescription_id)

    def list_prescriptions(
        self,
        phone_number: Optional[str] = None,
        status: Optional[PrescriptionStatus] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Prescription], int]:
        """List prescriptions with optional filters."""
        prescriptions = list(self._prescriptions.values())

        # Apply filters
        if phone_number:
            prescriptions = [p for p in prescriptions if p.phone_number == phone_number]
        if status:
            prescriptions = [p for p in prescriptions if p.status == status]

        total = len(prescriptions)

        # Sort by created_at descending
        prescriptions.sort(key=lambda p: p.created_at, reverse=True)

        # Apply pagination
        prescriptions = prescriptions[offset : offset + limit]

        return prescriptions, total

    def update_prescription(
        self, prescription_id: UUID, request: UpdatePrescriptionRequest
    ) -> Optional[Prescription]:
        """Update a prescription."""
        prescription = self._prescriptions.get(prescription_id)
        if not prescription:
            return None

        now = datetime.now(timezone.utc)

        # Update fields that are provided
        update_data = request.model_dump(exclude_unset=True)

        if "items" in update_data and update_data["items"]:
            # Convert input items to prescription items with new IDs
            items = [
                PrescriptionItem(
                    id=uuid4(),
                    text=item.text,
                    schedule=item.schedule,
                )
                for item in request.items
            ]
            update_data["items"] = items

            # Regenerate reminders
            self._reminders.pop(prescription_id, None)

        # Create updated prescription
        updated_prescription = prescription.model_copy(
            update={**update_data, "updated_at": now}
        )
        self._prescriptions[prescription_id] = updated_prescription

        # Regenerate reminders if items changed
        if "items" in update_data:
            self._create_mock_reminders(updated_prescription)

        return updated_prescription

    def update_prescription_status(
        self, prescription_id: UUID, status: PrescriptionStatus
    ) -> Optional[Prescription]:
        """Update a prescription's status."""
        prescription = self._prescriptions.get(prescription_id)
        if not prescription:
            return None

        now = datetime.now(timezone.utc)
        updated_prescription = prescription.model_copy(
            update={"status": status, "updated_at": now}
        )
        self._prescriptions[prescription_id] = updated_prescription

        # Update reminders based on status
        if status in (PrescriptionStatus.CANCELLED, PrescriptionStatus.COMPLETED):
            self._cancel_pending_reminders(prescription_id)

        return updated_prescription

    def delete_prescription(self, prescription_id: UUID) -> bool:
        """Delete a prescription."""
        if prescription_id not in self._prescriptions:
            return False

        del self._prescriptions[prescription_id]
        self._reminders.pop(prescription_id, None)
        return True

    # Reminder operations

    def get_reminders(
        self,
        prescription_id: UUID,
        status: Optional[ReminderStatus] = None,
    ) -> Optional[list[Reminder]]:
        """Get reminders for a prescription."""
        if prescription_id not in self._prescriptions:
            return None

        reminders = self._reminders.get(prescription_id, [])

        if status:
            reminders = [r for r in reminders if r.status == status]

        return reminders

    def _create_mock_reminders(self, prescription: Prescription) -> None:
        """Create mock reminders for a prescription."""
        now = datetime.now(timezone.utc)
        reminders = []

        for item in prescription.items:
            # Create a few mock reminders for each item
            for i in range(3):
                reminder = Reminder(
                    id=uuid4(),
                    prescription_id=prescription.id,
                    item_id=item.id,
                    message=self._generate_reminder_message(
                        item.text, prescription.language, prescription.recipient_name
                    ),
                    scheduled_at=now + timedelta(hours=8 * (i + 1)),
                    sent_at=None,
                    status=ReminderStatus.PENDING,
                )
                reminders.append(reminder)

        self._reminders[prescription.id] = reminders

    def _cancel_pending_reminders(self, prescription_id: UUID) -> None:
        """Cancel all pending reminders for a prescription."""
        reminders = self._reminders.get(prescription_id, [])
        for reminder in reminders:
            if reminder.status == ReminderStatus.PENDING:
                # Create updated reminder with cancelled status
                idx = reminders.index(reminder)
                reminders[idx] = reminder.model_copy(
                    update={"status": ReminderStatus.CANCELLED}
                )

    def _generate_reminder_message(
        self, medication_text: str, language: str, recipient_name: Optional[str]
    ) -> str:
        """Generate a friendly reminder message."""
        name = recipient_name or "there"

        if language == "es":
            return f"💊 ¡Hola {name}! Es hora de tu medicina. {medication_text}. ¡Tú puedes! 💪"
        else:
            return f"💊 Hey {name}! Time for your medicine. {medication_text}. You got this! 💪"


# Singleton instance
_db_instance: Optional[MockDatabase] = None


def get_db() -> MockDatabase:
    """Get the database instance (dependency injection)."""
    global _db_instance
    if _db_instance is None:
        _db_instance = MockDatabase()
    return _db_instance


def reset_db() -> None:
    """Reset the database (for testing)."""
    global _db_instance
    if _db_instance:
        _db_instance.clear()
    _db_instance = MockDatabase()
