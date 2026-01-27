"""Integration tests for the complete prescription workflow."""

import pytest
from fastapi.testclient import TestClient


class TestPrescriptionWorkflow:
    """
    Integration tests that verify the complete prescription workflow.
    
    These tests run in sequence and share database state to verify
    data persistence and relationships between operations.
    """

    # Store IDs across tests
    prescription_id: str = ""
    item_ids: list[str] = []

    def test_01_create_prescription(self, client: TestClient) -> None:
        """Step 1: Create a new prescription with multiple items."""
        response = client.post(
            "/api/v1/prescriptions",
            json={
                "phone_number": "+15551234567",
                "items": [
                    {"text": "Take 1 aspirin every morning"},
                    {"text": "Take 2 vitamin D pills at noon"},
                    {"text": "Take 1 melatonin before bed"},
                ],
                "language": "en",
                "timezone": "America/New_York",
                "recipient_name": "Grandma Rose",
            },
        )

        assert response.status_code == 201
        data = response.json()

        # Store for later tests
        TestPrescriptionWorkflow.prescription_id = data["id"]
        TestPrescriptionWorkflow.item_ids = [item["id"] for item in data["items"]]

        # Verify response
        assert data["phone_number"] == "+15551234567"
        assert data["status"] == "active"
        assert len(data["items"]) == 3
        assert data["recipient_name"] == "Grandma Rose"

    def test_02_verify_prescription_persisted(self, client: TestClient) -> None:
        """Step 2: Verify the prescription was persisted to the database."""
        response = client.get(
            f"/api/v1/prescriptions/{TestPrescriptionWorkflow.prescription_id}"
        )

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == TestPrescriptionWorkflow.prescription_id
        assert data["phone_number"] == "+15551234567"
        assert len(data["items"]) == 3

    def test_03_verify_reminders_created(self, client: TestClient) -> None:
        """Step 3: Verify reminders were automatically created for each item."""
        response = client.get(
            f"/api/v1/prescriptions/{TestPrescriptionWorkflow.prescription_id}/reminders"
        )

        assert response.status_code == 200
        data = response.json()

        # 3 items × 3 reminders each = 9 total reminders
        assert data["total"] == 9
        assert len(data["reminders"]) == 9

        # All reminders should be pending
        for reminder in data["reminders"]:
            assert reminder["status"] == "pending"
            assert reminder["prescription_id"] == TestPrescriptionWorkflow.prescription_id
            assert reminder["item_id"] in TestPrescriptionWorkflow.item_ids

    def test_04_list_prescriptions_shows_created(self, client: TestClient) -> None:
        """Step 4: Verify the prescription appears in the list."""
        response = client.get("/api/v1/prescriptions")

        assert response.status_code == 200
        data = response.json()

        assert data["total"] >= 1
        prescription_ids = [p["id"] for p in data["prescriptions"]]
        assert TestPrescriptionWorkflow.prescription_id in prescription_ids

    def test_05_filter_by_phone_number(self, client: TestClient) -> None:
        """Step 5: Test filtering prescriptions by phone number."""
        response = client.get(
            "/api/v1/prescriptions?phone_number=%2B15551234567"
        )

        assert response.status_code == 200
        data = response.json()

        assert data["total"] >= 1
        for prescription in data["prescriptions"]:
            assert prescription["phone_number"] == "+15551234567"

    def test_06_update_prescription(self, client: TestClient) -> None:
        """Step 6: Update the prescription's phone number."""
        response = client.put(
            f"/api/v1/prescriptions/{TestPrescriptionWorkflow.prescription_id}",
            json={
                "phone_number": "+15559999999",
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert data["phone_number"] == "+15559999999"
        # Items should remain unchanged
        assert len(data["items"]) == 3

    def test_07_verify_update_persisted(self, client: TestClient) -> None:
        """Step 7: Verify the update was persisted."""
        response = client.get(
            f"/api/v1/prescriptions/{TestPrescriptionWorkflow.prescription_id}"
        )

        assert response.status_code == 200
        data = response.json()

        assert data["phone_number"] == "+15559999999"

    def test_08_pause_prescription(self, client: TestClient) -> None:
        """Step 8: Pause the prescription."""
        response = client.patch(
            f"/api/v1/prescriptions/{TestPrescriptionWorkflow.prescription_id}/status",
            json={"status": "paused"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "paused"

    def test_09_reactivate_prescription(self, client: TestClient) -> None:
        """Step 9: Reactivate the prescription."""
        response = client.patch(
            f"/api/v1/prescriptions/{TestPrescriptionWorkflow.prescription_id}/status",
            json={"status": "active"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "active"

    def test_10_complete_prescription(self, client: TestClient) -> None:
        """Step 10: Complete the prescription (should cancel pending reminders)."""
        response = client.patch(
            f"/api/v1/prescriptions/{TestPrescriptionWorkflow.prescription_id}/status",
            json={"status": "completed"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "completed"

    def test_11_verify_reminders_cancelled(self, client: TestClient) -> None:
        """Step 11: Verify pending reminders were cancelled."""
        response = client.get(
            f"/api/v1/prescriptions/{TestPrescriptionWorkflow.prescription_id}/reminders"
        )

        assert response.status_code == 200
        data = response.json()

        # All reminders should now be cancelled
        for reminder in data["reminders"]:
            assert reminder["status"] == "cancelled"

    def test_12_delete_prescription(self, client: TestClient) -> None:
        """Step 12: Delete the prescription."""
        response = client.delete(
            f"/api/v1/prescriptions/{TestPrescriptionWorkflow.prescription_id}"
        )

        assert response.status_code == 204

    def test_13_verify_prescription_deleted(self, client: TestClient) -> None:
        """Step 13: Verify the prescription was deleted."""
        response = client.get(
            f"/api/v1/prescriptions/{TestPrescriptionWorkflow.prescription_id}"
        )

        assert response.status_code == 404

    def test_14_verify_reminders_cascade_deleted(self, client: TestClient) -> None:
        """Step 14: Verify reminders were cascade deleted."""
        response = client.get(
            f"/api/v1/prescriptions/{TestPrescriptionWorkflow.prescription_id}/reminders"
        )

        # Should return 404 since prescription doesn't exist
        assert response.status_code == 404
