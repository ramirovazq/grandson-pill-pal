"""Prescription management endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.db.mock_db import MockDatabase, get_db
from src.models.common import ErrorResponse
from src.models.prescription import (
    CreatePrescriptionRequest,
    Prescription,
    PrescriptionList,
    PrescriptionStatus,
    UpdatePrescriptionRequest,
    UpdateStatusRequest,
)
from src.models.reminder import ReminderList, ReminderStatus

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


@router.post(
    "",
    response_model=Prescription,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new prescription",
    description="Create a new prescription with medication items and schedule reminders.",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request data"},
        422: {"description": "Validation error"},
    },
)
async def create_prescription(
    request: CreatePrescriptionRequest,
    db: MockDatabase = Depends(get_db),
) -> Prescription:
    """Create a new prescription with medication items."""
    return db.create_prescription(request)


@router.get(
    "",
    response_model=PrescriptionList,
    summary="List all prescriptions",
    description="Get a list of all prescriptions, optionally filtered by phone number or status.",
)
async def list_prescriptions(
    phone_number: Optional[str] = Query(
        default=None, description="Filter by phone number"
    ),
    prescription_status: Optional[PrescriptionStatus] = Query(
        default=None, alias="status", description="Filter by prescription status"
    ),
    limit: int = Query(
        default=20, ge=1, le=100, description="Maximum number of results"
    ),
    offset: int = Query(default=0, ge=0, description="Number of results to skip"),
    db: MockDatabase = Depends(get_db),
) -> PrescriptionList:
    """List prescriptions with optional filters and pagination."""
    prescriptions, total = db.list_prescriptions(
        phone_number=phone_number,
        status=prescription_status,
        limit=limit,
        offset=offset,
    )
    return PrescriptionList(
        prescriptions=prescriptions,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{prescription_id}",
    response_model=Prescription,
    summary="Get a prescription by ID",
    description="Retrieve a specific prescription by its ID.",
    responses={
        404: {"model": ErrorResponse, "description": "Prescription not found"},
    },
)
async def get_prescription(
    prescription_id: UUID,
    db: MockDatabase = Depends(get_db),
) -> Prescription:
    """Get a specific prescription by ID."""
    prescription = db.get_prescription(prescription_id)
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Prescription not found"},
        )
    return prescription


@router.put(
    "/{prescription_id}",
    response_model=Prescription,
    summary="Update a prescription",
    description="Update an existing prescription's items or phone number.",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request data"},
        404: {"model": ErrorResponse, "description": "Prescription not found"},
    },
)
async def update_prescription(
    prescription_id: UUID,
    request: UpdatePrescriptionRequest,
    db: MockDatabase = Depends(get_db),
) -> Prescription:
    """Update an existing prescription."""
    prescription = db.update_prescription(prescription_id, request)
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Prescription not found"},
        )
    return prescription


@router.delete(
    "/{prescription_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a prescription",
    description="Delete a prescription and cancel all associated reminders.",
    responses={
        404: {"model": ErrorResponse, "description": "Prescription not found"},
    },
)
async def delete_prescription(
    prescription_id: UUID,
    db: MockDatabase = Depends(get_db),
) -> None:
    """Delete a prescription."""
    deleted = db.delete_prescription(prescription_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Prescription not found"},
        )


@router.patch(
    "/{prescription_id}/status",
    response_model=Prescription,
    summary="Update prescription status",
    description="Activate, pause, or deactivate a prescription's reminders.",
    responses={
        404: {"model": ErrorResponse, "description": "Prescription not found"},
    },
)
async def update_prescription_status(
    prescription_id: UUID,
    request: UpdateStatusRequest,
    db: MockDatabase = Depends(get_db),
) -> Prescription:
    """Update a prescription's status."""
    prescription = db.update_prescription_status(prescription_id, request.status)
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Prescription not found"},
        )
    return prescription


@router.get(
    "/{prescription_id}/reminders",
    response_model=ReminderList,
    tags=["Reminders"],
    summary="Get reminders for a prescription",
    description="List all scheduled reminders for a specific prescription.",
    responses={
        404: {"model": ErrorResponse, "description": "Prescription not found"},
    },
)
async def get_prescription_reminders(
    prescription_id: UUID,
    reminder_status: Optional[ReminderStatus] = Query(
        default=None, alias="status", description="Filter by reminder status"
    ),
    db: MockDatabase = Depends(get_db),
) -> ReminderList:
    """Get all reminders for a prescription."""
    reminders = db.get_reminders(prescription_id, status=reminder_status)
    if reminders is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Prescription not found"},
        )
    return ReminderList(reminders=reminders, total=len(reminders))
