"""
Client for the Prescription Extractor Service.

Use this to call the extractor service from the main backend.
"""

import os
from typing import Optional

import httpx
from fastapi.concurrency import run_in_threadpool

from src.services.prescription_extractor import (
    ExtractionResponse,
    PrescriptionItem,
    get_service,
)


class PrescriptionExtractorClient:
    """HTTP or local client for the Prescription Extractor Service."""

    def __init__(self, base_url: Optional[str] = None):
        """
        Initialize the client.

        Args:
            base_url: Service URL. Defaults to EXTRACTOR_SERVICE_URL env var
                      or http://localhost:8001
        """
        self.use_local = os.getenv("USE_LOCAL_EXTRACTOR", "false").lower() == "true"
        self.base_url = base_url or os.getenv(
            "EXTRACTOR_SERVICE_URL", "http://localhost:8001"
        )

    async def extract(self, prescription_text: str) -> ExtractionResponse:
        """
        Extract prescription data.

        Args:
            prescription_text: The raw prescription text to analyze.

        Returns:
            ExtractionResponse with the extracted items.
        """
        if self.use_local:
            service = get_service()
            # extract is a sync method (uses sync OpenAI client), so we runs it in threadpool
            # to avoid blocking the async event loop
            return await run_in_threadpool(service.extract, prescription_text)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/extract",
                json={"prescription_text": prescription_text},
                timeout=30.0,  # LLM calls can be slow
            )
            response.raise_for_status()
            data = response.json()

            items = [PrescriptionItem(**item) for item in data.get("items", [])]
            return ExtractionResponse(
                items=items, raw_response=data.get("raw_response")
            )

    async def health_check(self) -> bool:
        """Check if the extractor service is healthy."""
        if self.use_local:
            try:
                # Basic check if service can be instantiated
                get_service()
                return True
            except Exception:
                return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/health", timeout=5.0)
                return response.status_code == 200
        except Exception:
            return False


# Convenience function for simple usage
async def extract_prescription(prescription_text: str) -> ExtractionResponse:
    """
    Extract prescription data using the default client.

    Example:
        from src.services.extractor_client import extract_prescription

        result = await extract_prescription("Omeoprazol 5mg cada 24 horas")
        for item in result.items:
            print(item.item_name, item.doses_per_day)
    """
    client = PrescriptionExtractorClient()
    return await client.extract(prescription_text)
