"""Tests for prescription endpoints."""

import uuid

from fastapi.testclient import TestClient


class TestCreatePrescription:
    """Tests for creating prescriptions."""

    def test_create_prescription_success(
        self, client: TestClient, sample_prescription_data: dict
    ) -> None:
        """Should create a prescription successfully."""
        response = client.post("/api/v1/prescriptions", json=sample_prescription_data)
        assert response.status_code == 201

        data = response.json()
        assert "id" in data
        assert data["phone_number"] == sample_prescription_data["phone_number"]
        assert len(data["items"]) == len(sample_prescription_data["items"])
        assert data["status"] == "active"

    def test_create_prescription_generates_item_ids(
        self, client: TestClient, sample_prescription_data: dict
    ) -> None:
        """Should generate UUIDs for prescription items."""
        response = client.post("/api/v1/prescriptions", json=sample_prescription_data)
        data = response.json()

        for item in data["items"]:
            assert "id" in item
            # Validate it's a valid UUID
            uuid.UUID(item["id"])

    def test_create_prescription_sets_timestamps(
        self, client: TestClient, sample_prescription_data: dict
    ) -> None:
        """Should set created_at and updated_at timestamps."""
        response = client.post("/api/v1/prescriptions", json=sample_prescription_data)
        data = response.json()

        assert "created_at" in data
        assert "updated_at" in data
        assert data["created_at"] is not None
        assert data["updated_at"] is not None

    def test_create_prescription_with_minimal_data(self, client: TestClient) -> None:
        """Should create a prescription with only required fields."""
        minimal_data = {
            "phone_number": "+15551234567",
            "items": [{"text": "Take 1 pill daily"}],
        }
        response = client.post("/api/v1/prescriptions", json=minimal_data)
        assert response.status_code == 201

        data = response.json()
        assert data["language"] == "en"  # Default value
        assert data["timezone"] == "UTC"  # Default value

    def test_create_prescription_validation_error_empty_items(
        self, client: TestClient
    ) -> None:
        """Should return 422 for empty items list."""
        invalid_data = {"phone_number": "+15551234567", "items": []}
        response = client.post("/api/v1/prescriptions", json=invalid_data)
        assert response.status_code == 422

    def test_create_prescription_validation_error_missing_phone(
        self, client: TestClient
    ) -> None:
        """Should return 422 for missing phone number."""
        invalid_data = {"items": [{"text": "Take 1 pill daily"}]}
        response = client.post("/api/v1/prescriptions", json=invalid_data)
        assert response.status_code == 422

    def test_create_prescription_spanish_language(self, client: TestClient) -> None:
        """Should create a prescription with Spanish language."""
        data = {
            "phone_number": "+15551234567",
            "items": [{"text": "Tomar 1 pastilla diaria"}],
            "language": "es",
        }
        response = client.post("/api/v1/prescriptions", json=data)
        assert response.status_code == 201
        assert response.json()["language"] == "es"


class TestListPrescriptions:
    """Tests for listing prescriptions."""

    def test_list_prescriptions_empty(self, client: TestClient) -> None:
        """Should return empty list when no prescriptions exist."""
        response = client.get("/api/v1/prescriptions")
        assert response.status_code == 200

        data = response.json()
        assert data["prescriptions"] == []
        assert data["total"] == 0

    def test_list_prescriptions_returns_created(
        self, client: TestClient, created_prescription: dict
    ) -> None:
        """Should return created prescriptions."""
        response = client.get("/api/v1/prescriptions")
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 1
        assert len(data["prescriptions"]) == 1
        assert data["prescriptions"][0]["id"] == created_prescription["id"]

    def test_list_prescriptions_filter_by_phone(
        self, client: TestClient, sample_prescription_data: dict
    ) -> None:
        """Should filter prescriptions by phone number."""
        from urllib.parse import quote
        
        # Create two prescriptions with different phone numbers
        client.post("/api/v1/prescriptions", json=sample_prescription_data)

        other_data = sample_prescription_data.copy()
        other_data["phone_number"] = "+15559999999"
        client.post("/api/v1/prescriptions", json=other_data)

        # Filter by the first phone number (URL encode the + sign)
        encoded_phone = quote(sample_prescription_data["phone_number"], safe="")
        response = client.get(f"/api/v1/prescriptions?phone_number={encoded_phone}")
        data = response.json()

        assert data["total"] == 1
        assert data["prescriptions"][0]["phone_number"] == sample_prescription_data["phone_number"]

    def test_list_prescriptions_filter_by_status(
        self, client: TestClient, created_prescription: dict
    ) -> None:
        """Should filter prescriptions by status."""
        response = client.get("/api/v1/prescriptions?status=active")
        assert response.status_code == 200
        assert response.json()["total"] == 1

        response = client.get("/api/v1/prescriptions?status=paused")
        assert response.status_code == 200
        assert response.json()["total"] == 0

    def test_list_prescriptions_pagination(
        self, client: TestClient, sample_prescription_data: dict
    ) -> None:
        """Should support pagination."""
        # Create 5 prescriptions
        for _ in range(5):
            client.post("/api/v1/prescriptions", json=sample_prescription_data)

        # Get first page
        response = client.get("/api/v1/prescriptions?limit=2&offset=0")
        data = response.json()
        assert data["total"] == 5
        assert len(data["prescriptions"]) == 2
        assert data["limit"] == 2
        assert data["offset"] == 0

        # Get second page
        response = client.get("/api/v1/prescriptions?limit=2&offset=2")
        data = response.json()
        assert len(data["prescriptions"]) == 2
        assert data["offset"] == 2


class TestGetPrescription:
    """Tests for getting a single prescription."""

    def test_get_prescription_success(
        self, client: TestClient, created_prescription: dict
    ) -> None:
        """Should return the prescription."""
        prescription_id = created_prescription["id"]
        response = client.get(f"/api/v1/prescriptions/{prescription_id}")
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == prescription_id
        assert data["phone_number"] == created_prescription["phone_number"]

    def test_get_prescription_not_found(self, client: TestClient) -> None:
        """Should return 404 for non-existent prescription."""
        fake_id = str(uuid.uuid4())
        response = client.get(f"/api/v1/prescriptions/{fake_id}")
        assert response.status_code == 404

    def test_get_prescription_invalid_uuid(self, client: TestClient) -> None:
        """Should return 422 for invalid UUID."""
        response = client.get("/api/v1/prescriptions/not-a-uuid")
        assert response.status_code == 422


class TestUpdatePrescription:
    """Tests for updating prescriptions."""

    def test_update_prescription_phone_number(
        self, client: TestClient, created_prescription: dict
    ) -> None:
        """Should update the phone number."""
        prescription_id = created_prescription["id"]
        update_data = {"phone_number": "+15559999999"}

        response = client.put(
            f"/api/v1/prescriptions/{prescription_id}", json=update_data
        )
        assert response.status_code == 200

        data = response.json()
        assert data["phone_number"] == "+15559999999"

    def test_update_prescription_items(
        self, client: TestClient, created_prescription: dict
    ) -> None:
        """Should update the medication items."""
        prescription_id = created_prescription["id"]
        update_data = {
            "items": [
                {"text": "New medication 1"},
                {"text": "New medication 2"},
                {"text": "New medication 3"},
            ]
        }

        response = client.put(
            f"/api/v1/prescriptions/{prescription_id}", json=update_data
        )
        assert response.status_code == 200

        data = response.json()
        assert len(data["items"]) == 3
        assert data["items"][0]["text"] == "New medication 1"

    def test_update_prescription_not_found(self, client: TestClient) -> None:
        """Should return 404 for non-existent prescription."""
        fake_id = str(uuid.uuid4())
        response = client.put(
            f"/api/v1/prescriptions/{fake_id}", json={"phone_number": "+15559999999"}
        )
        assert response.status_code == 404

    def test_update_prescription_updates_timestamp(
        self, client: TestClient, created_prescription: dict
    ) -> None:
        """Should update the updated_at timestamp."""
        prescription_id = created_prescription["id"]
        original_updated_at = created_prescription["updated_at"]

        response = client.put(
            f"/api/v1/prescriptions/{prescription_id}",
            json={"recipient_name": "New Name"},
        )
        data = response.json()

        assert data["updated_at"] != original_updated_at


class TestDeletePrescription:
    """Tests for deleting prescriptions."""

    def test_delete_prescription_success(
        self, client: TestClient, created_prescription: dict
    ) -> None:
        """Should delete the prescription."""
        prescription_id = created_prescription["id"]

        response = client.delete(f"/api/v1/prescriptions/{prescription_id}")
        assert response.status_code == 204

        # Verify it's deleted
        response = client.get(f"/api/v1/prescriptions/{prescription_id}")
        assert response.status_code == 404

    def test_delete_prescription_not_found(self, client: TestClient) -> None:
        """Should return 404 for non-existent prescription."""
        fake_id = str(uuid.uuid4())
        response = client.delete(f"/api/v1/prescriptions/{fake_id}")
        assert response.status_code == 404


class TestUpdatePrescriptionStatus:
    """Tests for updating prescription status."""

    def test_update_status_to_paused(
        self, client: TestClient, created_prescription: dict
    ) -> None:
        """Should update status to paused."""
        prescription_id = created_prescription["id"]

        response = client.patch(
            f"/api/v1/prescriptions/{prescription_id}/status",
            json={"status": "paused"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "paused"

    def test_update_status_to_completed(
        self, client: TestClient, created_prescription: dict
    ) -> None:
        """Should update status to completed."""
        prescription_id = created_prescription["id"]

        response = client.patch(
            f"/api/v1/prescriptions/{prescription_id}/status",
            json={"status": "completed"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "completed"

    def test_update_status_to_cancelled(
        self, client: TestClient, created_prescription: dict
    ) -> None:
        """Should update status to cancelled."""
        prescription_id = created_prescription["id"]

        response = client.patch(
            f"/api/v1/prescriptions/{prescription_id}/status",
            json={"status": "cancelled"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"

    def test_update_status_not_found(self, client: TestClient) -> None:
        """Should return 404 for non-existent prescription."""
        fake_id = str(uuid.uuid4())
        response = client.patch(
            f"/api/v1/prescriptions/{fake_id}/status", json={"status": "paused"}
        )
        assert response.status_code == 404

    def test_update_status_invalid_status(
        self, client: TestClient, created_prescription: dict
    ) -> None:
        """Should return 422 for invalid status."""
        prescription_id = created_prescription["id"]

        response = client.patch(
            f"/api/v1/prescriptions/{prescription_id}/status",
            json={"status": "invalid_status"},
        )
        assert response.status_code == 422


class TestGetPrescriptionReminders:
    """Tests for getting prescription reminders."""

    def test_get_reminders_success(
        self, client: TestClient, created_prescription: dict
    ) -> None:
        """Should return reminders for the prescription."""
        prescription_id = created_prescription["id"]

        response = client.get(f"/api/v1/prescriptions/{prescription_id}/reminders")
        assert response.status_code == 200

        data = response.json()
        assert "reminders" in data
        assert "total" in data
        assert len(data["reminders"]) > 0

    def test_get_reminders_contain_correct_data(
        self, client: TestClient, created_prescription: dict
    ) -> None:
        """Reminders should contain correct prescription and item IDs."""
        prescription_id = created_prescription["id"]

        response = client.get(f"/api/v1/prescriptions/{prescription_id}/reminders")
        data = response.json()

        for reminder in data["reminders"]:
            assert reminder["prescription_id"] == prescription_id
            assert "item_id" in reminder
            assert "message" in reminder
            assert "scheduled_at" in reminder
            assert reminder["status"] == "pending"

    def test_get_reminders_filter_by_status(
        self, client: TestClient, created_prescription: dict
    ) -> None:
        """Should filter reminders by status."""
        prescription_id = created_prescription["id"]

        # All reminders should be pending initially
        response = client.get(
            f"/api/v1/prescriptions/{prescription_id}/reminders?status=pending"
        )
        assert response.status_code == 200
        assert response.json()["total"] > 0

        # No sent reminders yet
        response = client.get(
            f"/api/v1/prescriptions/{prescription_id}/reminders?status=sent"
        )
        assert response.status_code == 200
        assert response.json()["total"] == 0

    def test_get_reminders_not_found(self, client: TestClient) -> None:
        """Should return 404 for non-existent prescription."""
        fake_id = str(uuid.uuid4())
        response = client.get(f"/api/v1/prescriptions/{fake_id}/reminders")
        assert response.status_code == 404
