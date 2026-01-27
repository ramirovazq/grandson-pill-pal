"""Integration tests for data integrity and edge cases."""

import pytest
from fastapi.testclient import TestClient


class TestDataIntegrity:
    """
    Integration tests for data integrity, constraints, and edge cases.
    """

    def test_create_prescription_with_many_items(self, client: TestClient) -> None:
        """Test creating a prescription with many medication items."""
        items = [{"text": f"Medication {i}"} for i in range(10)]

        response = client.post(
            "/api/v1/prescriptions",
            json={
                "phone_number": "+15553333333",
                "items": items,
                "language": "en",
            },
        )

        assert response.status_code == 201
        data = response.json()

        assert len(data["items"]) == 10
        prescription_id = data["id"]

        # Verify reminders (10 items × 3 reminders = 30)
        response = client.get(f"/api/v1/prescriptions/{prescription_id}/reminders")
        assert response.json()["total"] == 30

        # Cleanup
        client.delete(f"/api/v1/prescriptions/{prescription_id}")

    def test_update_items_replaces_all(self, client: TestClient) -> None:
        """Test that updating items replaces all existing items and reminders."""
        # Create prescription with 2 items
        response = client.post(
            "/api/v1/prescriptions",
            json={
                "phone_number": "+15554444444",
                "items": [
                    {"text": "Original item 1"},
                    {"text": "Original item 2"},
                ],
                "language": "en",
            },
        )
        prescription_id = response.json()["id"]
        original_item_ids = [item["id"] for item in response.json()["items"]]

        # Update with 3 new items
        response = client.put(
            f"/api/v1/prescriptions/{prescription_id}",
            json={
                "items": [
                    {"text": "New item 1"},
                    {"text": "New item 2"},
                    {"text": "New item 3"},
                ],
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Should have 3 items now
        assert len(data["items"]) == 3
        new_item_ids = [item["id"] for item in data["items"]]

        # All item IDs should be different
        for old_id in original_item_ids:
            assert old_id not in new_item_ids

        # Verify new item texts
        item_texts = [item["text"] for item in data["items"]]
        assert "New item 1" in item_texts
        assert "New item 2" in item_texts
        assert "New item 3" in item_texts

        # Verify reminders were regenerated (3 items × 3 reminders = 9)
        response = client.get(f"/api/v1/prescriptions/{prescription_id}/reminders")
        reminders_data = response.json()
        assert reminders_data["total"] == 9

        # All reminders should reference new items
        for reminder in reminders_data["reminders"]:
            assert reminder["item_id"] in new_item_ids

        # Cleanup
        client.delete(f"/api/v1/prescriptions/{prescription_id}")

    def test_pagination_works_correctly(self, client: TestClient) -> None:
        """Test pagination across multiple prescriptions."""
        # Create 5 prescriptions
        created_ids = []
        for i in range(5):
            response = client.post(
                "/api/v1/prescriptions",
                json={
                    "phone_number": f"+1555000000{i}",
                    "items": [{"text": f"Item for prescription {i}"}],
                    "language": "en",
                },
            )
            created_ids.append(response.json()["id"])

        # Test pagination with limit=2
        response = client.get("/api/v1/prescriptions?limit=2&offset=0")
        data = response.json()
        assert len(data["prescriptions"]) == 2
        assert data["limit"] == 2
        assert data["offset"] == 0

        # Get next page
        response = client.get("/api/v1/prescriptions?limit=2&offset=2")
        data = response.json()
        assert len(data["prescriptions"]) == 2
        assert data["offset"] == 2

        # Get last page
        response = client.get("/api/v1/prescriptions?limit=2&offset=4")
        data = response.json()
        assert len(data["prescriptions"]) >= 1

        # Cleanup
        for prescription_id in created_ids:
            client.delete(f"/api/v1/prescriptions/{prescription_id}")

    def test_filter_by_status(self, client: TestClient) -> None:
        """Test filtering prescriptions by status."""
        # Create prescriptions with different statuses
        active_response = client.post(
            "/api/v1/prescriptions",
            json={
                "phone_number": "+15556666666",
                "items": [{"text": "Active prescription"}],
                "language": "en",
            },
        )
        active_id = active_response.json()["id"]

        paused_response = client.post(
            "/api/v1/prescriptions",
            json={
                "phone_number": "+15557777777",
                "items": [{"text": "Paused prescription"}],
                "language": "en",
            },
        )
        paused_id = paused_response.json()["id"]
        client.patch(f"/api/v1/prescriptions/{paused_id}/status", json={"status": "paused"})

        # Filter by active status
        response = client.get("/api/v1/prescriptions?status=active")
        data = response.json()
        for prescription in data["prescriptions"]:
            assert prescription["status"] == "active"

        # Filter by paused status
        response = client.get("/api/v1/prescriptions?status=paused")
        data = response.json()
        for prescription in data["prescriptions"]:
            assert prescription["status"] == "paused"

        # Cleanup
        client.delete(f"/api/v1/prescriptions/{active_id}")
        client.delete(f"/api/v1/prescriptions/{paused_id}")

    def test_concurrent_operations(self, client: TestClient) -> None:
        """Test that multiple operations maintain data integrity."""
        # Create two prescriptions with same phone number
        response1 = client.post(
            "/api/v1/prescriptions",
            json={
                "phone_number": "+15558888888",
                "items": [{"text": "Prescription A"}],
                "language": "en",
            },
        )
        id1 = response1.json()["id"]

        response2 = client.post(
            "/api/v1/prescriptions",
            json={
                "phone_number": "+15558888888",
                "items": [{"text": "Prescription B"}],
                "language": "en",
            },
        )
        id2 = response2.json()["id"]

        # Both should exist
        assert client.get(f"/api/v1/prescriptions/{id1}").status_code == 200
        assert client.get(f"/api/v1/prescriptions/{id2}").status_code == 200

        # Filter should return both
        response = client.get("/api/v1/prescriptions?phone_number=%2B15558888888")
        assert response.json()["total"] >= 2

        # Delete one should not affect the other
        client.delete(f"/api/v1/prescriptions/{id1}")
        assert client.get(f"/api/v1/prescriptions/{id1}").status_code == 404
        assert client.get(f"/api/v1/prescriptions/{id2}").status_code == 200

        # Cleanup
        client.delete(f"/api/v1/prescriptions/{id2}")


class TestValidationErrors:
    """Integration tests for validation error handling."""

    def test_create_prescription_empty_items_rejected(self, client: TestClient) -> None:
        """Test that empty items list is rejected."""
        response = client.post(
            "/api/v1/prescriptions",
            json={
                "phone_number": "+15559999999",
                "items": [],
                "language": "en",
            },
        )

        assert response.status_code == 422

    def test_create_prescription_missing_phone_rejected(self, client: TestClient) -> None:
        """Test that missing phone number is rejected."""
        response = client.post(
            "/api/v1/prescriptions",
            json={
                "items": [{"text": "Some medication"}],
                "language": "en",
            },
        )

        assert response.status_code == 422

    def test_create_prescription_empty_item_text_rejected(self, client: TestClient) -> None:
        """Test that empty item text is rejected."""
        response = client.post(
            "/api/v1/prescriptions",
            json={
                "phone_number": "+15559999999",
                "items": [{"text": ""}],
                "language": "en",
            },
        )

        assert response.status_code == 422

    def test_invalid_uuid_returns_422(self, client: TestClient) -> None:
        """Test that invalid UUID format returns 422."""
        response = client.get("/api/v1/prescriptions/not-a-valid-uuid")

        assert response.status_code == 422

    def test_invalid_status_rejected(self, client: TestClient) -> None:
        """Test that invalid status is rejected."""
        # Create a prescription first
        create_response = client.post(
            "/api/v1/prescriptions",
            json={
                "phone_number": "+15550000000",
                "items": [{"text": "Test item"}],
                "language": "en",
            },
        )
        prescription_id = create_response.json()["id"]

        # Try to set invalid status
        response = client.patch(
            f"/api/v1/prescriptions/{prescription_id}/status",
            json={"status": "invalid_status"},
        )

        assert response.status_code == 422

        # Cleanup
        client.delete(f"/api/v1/prescriptions/{prescription_id}")
