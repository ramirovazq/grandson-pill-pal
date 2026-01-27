"""Tests for the Prescription Extractor Service."""

import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from src.services.prescription_extractor import (
    ExtractionRequest,
    ExtractionResponse,
    PrescriptionExtractorService,
    PrescriptionItem,
    app,
    get_service,
)


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_openai_response():
    """Create a mock OpenAI response."""
    return {
        "items": [
            {
                "item_type": "medication",
                "item_name": "Omeoprazol",
                "item_name_complete": "Omeoprazol 5mg",
                "pills_per_dose": 0.5,
                "doses_per_day": 1,
                "treatment_duration_days": 4,
                "total_pills_required": 2,
                "raw_prescription_text": "Omeoprazol 5mg 1/2 tableta cada 24 horas por 4 dias",
                "confidence_level": "high",
                "requires_human_review": False,
            }
        ]
    }


@pytest.fixture
def mock_openai_multi_item_response():
    """Create a mock OpenAI response with multiple items."""
    return {
        "items": [
            {
                "item_type": "medication",
                "item_name": "Omeoprazol",
                "item_name_complete": "Omeoprazol 5mg",
                "pills_per_dose": 0.5,
                "doses_per_day": 1,
                "treatment_duration_days": 4,
                "total_pills_required": 2,
                "raw_prescription_text": "Omeoprazol 5mg 1/2 tableta cada 24 horas por 4 dias",
                "confidence_level": "high",
                "requires_human_review": False,
            },
            {
                "item_type": "food",
                "item_name": "Alimento gastro royal Hills",
                "item_name_complete": "Alimento gastro royal Hills",
                "pills_per_dose": None,
                "doses_per_day": 3,
                "treatment_duration_days": 4,
                "total_pills_required": None,
                "raw_prescription_text": "Alimento gastro royal Hills 3 veces al dia por 4 dias",
                "confidence_level": "high",
                "requires_human_review": False,
            },
            {
                "item_type": "procedure",
                "item_name": "Ranitidina",
                "item_name_complete": "Ranitidina inyectable",
                "pills_per_dose": None,
                "doses_per_day": None,
                "treatment_duration_days": None,
                "total_pills_required": None,
                "raw_prescription_text": "Se aplicó ranitidina en consulta",
                "confidence_level": "low",
                "requires_human_review": True,
            },
        ]
    }


@pytest.fixture
def mock_openai_client(mock_openai_response):
    """Create a mock OpenAI client."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = json.dumps(mock_openai_response)
    mock_client.chat.completions.create.return_value = mock_response
    return mock_client


@pytest.fixture
def extractor_client():
    """Create a test client for the extractor API."""
    # Reset the global service instance
    import src.services.prescription_extractor as extractor_module

    extractor_module._service = None
    return TestClient(app)


# ============================================================================
# Unit Tests - PrescriptionItem Model
# ============================================================================


class TestPrescriptionItemModel:
    """Tests for PrescriptionItem Pydantic model."""

    def test_create_medication_item(self) -> None:
        """Should create a valid medication item."""
        item = PrescriptionItem(
            item_type="medication",
            item_name="Omeoprazol",
            item_name_complete="Omeoprazol 5mg",
            pills_per_dose=0.5,
            doses_per_day=1,
            treatment_duration_days=4,
            total_pills_required=2,
            raw_prescription_text="Omeoprazol 5mg 1/2 tableta",
            confidence_level="high",
            requires_human_review=False,
        )

        assert item.item_type == "medication"
        assert item.item_name == "Omeoprazol"
        assert item.pills_per_dose == 0.5
        assert item.requires_human_review is False

    def test_create_food_item_with_nulls(self) -> None:
        """Should create a food item with null medication fields."""
        item = PrescriptionItem(
            item_type="food",
            item_name="Alimento especial",
            item_name_complete="Alimento especial Hills",
            pills_per_dose=None,
            doses_per_day=3,
            treatment_duration_days=7,
            total_pills_required=None,
            raw_prescription_text="Alimento especial 3 veces al dia",
            confidence_level="medium",
            requires_human_review=False,
        )

        assert item.item_type == "food"
        assert item.pills_per_dose is None
        assert item.total_pills_required is None
        assert item.doses_per_day == 3

    def test_create_procedure_item(self) -> None:
        """Should create a procedure item with low confidence."""
        item = PrescriptionItem(
            item_type="procedure",
            item_name="Inyección",
            item_name_complete="Inyección de vitamina B12",
            pills_per_dose=None,
            doses_per_day=None,
            treatment_duration_days=None,
            total_pills_required=None,
            raw_prescription_text="Se aplicó inyección",
            confidence_level="low",
            requires_human_review=True,
        )

        assert item.item_type == "procedure"
        assert item.confidence_level == "low"
        assert item.requires_human_review is True


# ============================================================================
# Unit Tests - ExtractionRequest Model
# ============================================================================


class TestExtractionRequestModel:
    """Tests for ExtractionRequest Pydantic model."""

    def test_valid_request(self) -> None:
        """Should create a valid extraction request."""
        request = ExtractionRequest(
            prescription_text="Omeoprazol 5mg cada 24 horas"
        )
        assert request.prescription_text == "Omeoprazol 5mg cada 24 horas"

    def test_empty_text_raises_error(self) -> None:
        """Should raise error for empty prescription text."""
        with pytest.raises(ValueError):
            ExtractionRequest(prescription_text="")


# ============================================================================
# Unit Tests - PrescriptionExtractorService
# ============================================================================


class TestPrescriptionExtractorService:
    """Tests for PrescriptionExtractorService class."""

    def test_init_without_api_key_raises_error(self) -> None:
        """Should raise error when no API key is provided."""
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(ValueError, match="OPENAI_API_KEY is required"):
                PrescriptionExtractorService()

    def test_init_with_api_key(self) -> None:
        """Should initialize with provided API key."""
        with patch("src.services.prescription_extractor.OpenAI"):
            service = PrescriptionExtractorService(api_key="test-key")
            assert service.api_key == "test-key"

    def test_init_with_env_api_key(self) -> None:
        """Should initialize with API key from environment."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "env-test-key"}):
            with patch("src.services.prescription_extractor.OpenAI"):
                service = PrescriptionExtractorService()
                assert service.api_key == "env-test-key"

    def test_extract_returns_response(
        self, mock_openai_client, mock_openai_response
    ) -> None:
        """Should return ExtractionResponse with items."""
        with patch("src.services.prescription_extractor.OpenAI") as mock_openai:
            mock_openai.return_value = mock_openai_client

            service = PrescriptionExtractorService(api_key="test-key")
            result = service.extract("Omeoprazol 5mg cada 24 horas")

            assert isinstance(result, ExtractionResponse)
            assert len(result.items) == 1
            assert result.items[0].item_name == "Omeoprazol"

    def test_extract_calls_openai_correctly(self, mock_openai_client) -> None:
        """Should call OpenAI API with correct parameters."""
        with patch("src.services.prescription_extractor.OpenAI") as mock_openai:
            mock_openai.return_value = mock_openai_client

            service = PrescriptionExtractorService(api_key="test-key")
            service.extract("Test prescription")

            mock_openai_client.chat.completions.create.assert_called_once()
            call_args = mock_openai_client.chat.completions.create.call_args
            assert call_args.kwargs["model"] == "gpt-4o-mini"
            assert call_args.kwargs["response_format"] == {"type": "json_object"}

    def test_extract_handles_invalid_json(self) -> None:
        """Should raise ValueError for invalid JSON response."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "not valid json"
        mock_client.chat.completions.create.return_value = mock_response

        with patch("src.services.prescription_extractor.OpenAI") as mock_openai:
            mock_openai.return_value = mock_client

            service = PrescriptionExtractorService(api_key="test-key")
            with pytest.raises(ValueError, match="Failed to parse LLM response"):
                service.extract("Test prescription")

    def test_extract_handles_api_error(self) -> None:
        """Should raise RuntimeError for API errors."""
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("API Error")

        with patch("src.services.prescription_extractor.OpenAI") as mock_openai:
            mock_openai.return_value = mock_client

            service = PrescriptionExtractorService(api_key="test-key")
            with pytest.raises(RuntimeError, match="OpenAI API error"):
                service.extract("Test prescription")

    def test_extract_multiple_items(
        self, mock_openai_multi_item_response
    ) -> None:
        """Should extract multiple items from prescription."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps(
            mock_openai_multi_item_response
        )
        mock_client.chat.completions.create.return_value = mock_response

        with patch("src.services.prescription_extractor.OpenAI") as mock_openai:
            mock_openai.return_value = mock_client

            service = PrescriptionExtractorService(api_key="test-key")
            result = service.extract("Multiple items prescription")

            assert len(result.items) == 3
            assert result.items[0].item_type == "medication"
            assert result.items[1].item_type == "food"
            assert result.items[2].item_type == "procedure"
            assert result.items[2].requires_human_review is True


# ============================================================================
# API Endpoint Tests
# ============================================================================


class TestExtractorAPI:
    """Tests for the Extractor API endpoints."""

    def test_health_check(self, extractor_client: TestClient) -> None:
        """Health endpoint should return healthy status."""
        response = extractor_client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "prescription-extractor"

    def test_extract_endpoint_success(
        self, extractor_client: TestClient, mock_openai_response
    ) -> None:
        """Extract endpoint should return extracted items."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps(mock_openai_response)
        mock_client.chat.completions.create.return_value = mock_response

        with patch("src.services.prescription_extractor.OpenAI") as mock_openai:
            mock_openai.return_value = mock_client
            with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
                response = extractor_client.post(
                    "/extract",
                    json={"prescription_text": "Omeoprazol 5mg cada 24 horas"},
                )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 1
        assert data["items"][0]["item_name"] == "Omeoprazol"

    def test_extract_endpoint_empty_text(
        self, extractor_client: TestClient
    ) -> None:
        """Extract endpoint should reject empty text."""
        response = extractor_client.post(
            "/extract",
            json={"prescription_text": ""},
        )

        assert response.status_code == 422  # Validation error

    def test_extract_endpoint_missing_text(
        self, extractor_client: TestClient
    ) -> None:
        """Extract endpoint should reject missing text."""
        response = extractor_client.post(
            "/extract",
            json={},
        )

        assert response.status_code == 422  # Validation error

    def test_extract_endpoint_api_error(
        self, extractor_client: TestClient
    ) -> None:
        """Extract endpoint should return 500 for API errors."""
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("API Error")

        with patch("src.services.prescription_extractor.OpenAI") as mock_openai:
            mock_openai.return_value = mock_client
            with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
                # Reset service to use new mock
                import src.services.prescription_extractor as extractor_module

                extractor_module._service = None

                response = extractor_client.post(
                    "/extract",
                    json={"prescription_text": "Test prescription"},
                )

        assert response.status_code == 500

    def test_extract_endpoint_invalid_json_response(
        self, extractor_client: TestClient
    ) -> None:
        """Extract endpoint should return 400 for invalid JSON from LLM."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "invalid json"
        mock_client.chat.completions.create.return_value = mock_response

        with patch("src.services.prescription_extractor.OpenAI") as mock_openai:
            mock_openai.return_value = mock_client
            with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
                # Reset service
                import src.services.prescription_extractor as extractor_module

                extractor_module._service = None

                response = extractor_client.post(
                    "/extract",
                    json={"prescription_text": "Test prescription"},
                )

        assert response.status_code == 400


# ============================================================================
# Integration-style Tests (with mocked OpenAI)
# ============================================================================


class TestExtractorIntegration:
    """Integration-style tests with realistic scenarios."""

    def test_spanish_prescription(
        self, extractor_client: TestClient
    ) -> None:
        """Should handle Spanish prescription text."""
        spanish_response = {
            "items": [
                {
                    "item_type": "medication",
                    "item_name": "Ibuprofeno",
                    "item_name_complete": "Ibuprofeno 400mg",
                    "pills_per_dose": 1,
                    "doses_per_day": 3,
                    "treatment_duration_days": 5,
                    "total_pills_required": 15,
                    "raw_prescription_text": "Ibuprofeno 400mg cada 8 horas por 5 dias",
                    "confidence_level": "high",
                    "requires_human_review": False,
                }
            ]
        }

        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps(spanish_response)
        mock_client.chat.completions.create.return_value = mock_response

        with patch("src.services.prescription_extractor.OpenAI") as mock_openai:
            mock_openai.return_value = mock_client
            with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
                import src.services.prescription_extractor as extractor_module

                extractor_module._service = None

                response = extractor_client.post(
                    "/extract",
                    json={
                        "prescription_text": "Ibuprofeno 400mg cada 8 horas por 5 dias"
                    },
                )

        assert response.status_code == 200
        data = response.json()
        assert data["items"][0]["item_name"] == "Ibuprofeno"
        assert data["items"][0]["doses_per_day"] == 3

    def test_complex_prescription_with_multiple_types(
        self, extractor_client: TestClient, mock_openai_multi_item_response
    ) -> None:
        """Should handle prescription with medication, food, and procedure."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps(
            mock_openai_multi_item_response
        )
        mock_client.chat.completions.create.return_value = mock_response

        with patch("src.services.prescription_extractor.OpenAI") as mock_openai:
            mock_openai.return_value = mock_client
            with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
                import src.services.prescription_extractor as extractor_module

                extractor_module._service = None

                response = extractor_client.post(
                    "/extract",
                    json={
                        "prescription_text": "Omeoprazol 5mg. Alimento Hills. Se aplicó ranitidina."
                    },
                )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3

        # Check each item type
        types = [item["item_type"] for item in data["items"]]
        assert "medication" in types
        assert "food" in types
        assert "procedure" in types

        # Check that procedure requires human review
        procedure = next(i for i in data["items"] if i["item_type"] == "procedure")
        assert procedure["requires_human_review"] is True
        assert procedure["confidence_level"] == "low"
