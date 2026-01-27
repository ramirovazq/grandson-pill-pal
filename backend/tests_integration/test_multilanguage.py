"""Integration tests for multi-language support."""

import pytest
from fastapi.testclient import TestClient


class TestMultiLanguageSupport:
    """
    Integration tests for i18n support (English and Spanish).
    """

    english_prescription_id: str = ""
    spanish_prescription_id: str = ""

    def test_01_create_english_prescription(self, client: TestClient) -> None:
        """Create a prescription with English language."""
        response = client.post(
            "/api/v1/prescriptions",
            json={
                "phone_number": "+15551111111",
                "items": [{"text": "Take 1 pill daily"}],
                "language": "en",
                "recipient_name": "John",
            },
        )

        assert response.status_code == 201
        data = response.json()
        TestMultiLanguageSupport.english_prescription_id = data["id"]

        assert data["language"] == "en"

    def test_02_verify_english_reminder_messages(self, client: TestClient) -> None:
        """Verify reminder messages are in English."""
        response = client.get(
            f"/api/v1/prescriptions/{TestMultiLanguageSupport.english_prescription_id}/reminders"
        )

        assert response.status_code == 200
        data = response.json()

        for reminder in data["reminders"]:
            # English messages should contain "Hey" and "Time for your medicine"
            assert "Hey John" in reminder["message"]
            assert "Time for your medicine" in reminder["message"]
            assert "You got this!" in reminder["message"]

    def test_03_create_spanish_prescription(self, client: TestClient) -> None:
        """Create a prescription with Spanish language."""
        response = client.post(
            "/api/v1/prescriptions",
            json={
                "phone_number": "+15552222222",
                "items": [{"text": "Tomar 1 pastilla diaria"}],
                "language": "es",
                "recipient_name": "María",
            },
        )

        assert response.status_code == 201
        data = response.json()
        TestMultiLanguageSupport.spanish_prescription_id = data["id"]

        assert data["language"] == "es"

    def test_04_verify_spanish_reminder_messages(self, client: TestClient) -> None:
        """Verify reminder messages are in Spanish."""
        response = client.get(
            f"/api/v1/prescriptions/{TestMultiLanguageSupport.spanish_prescription_id}/reminders"
        )

        assert response.status_code == 200
        data = response.json()

        for reminder in data["reminders"]:
            # Spanish messages should contain "Hola" and "Es hora de tu medicina"
            assert "¡Hola María!" in reminder["message"]
            assert "Es hora de tu medicina" in reminder["message"]
            assert "¡Tú puedes!" in reminder["message"]

    def test_05_cleanup_english_prescription(self, client: TestClient) -> None:
        """Clean up English prescription."""
        response = client.delete(
            f"/api/v1/prescriptions/{TestMultiLanguageSupport.english_prescription_id}"
        )
        assert response.status_code == 204

    def test_06_cleanup_spanish_prescription(self, client: TestClient) -> None:
        """Clean up Spanish prescription."""
        response = client.delete(
            f"/api/v1/prescriptions/{TestMultiLanguageSupport.spanish_prescription_id}"
        )
        assert response.status_code == 204
