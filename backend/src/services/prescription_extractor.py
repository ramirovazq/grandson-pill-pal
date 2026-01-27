"""
Prescription Extractor Service

A microservice that uses OpenAI to extract structured medication data
from prescription text. Can be run as a standalone service or called
from the main backend.
"""

import json
import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from openai import OpenAI
from pydantic import BaseModel, Field

# ============================================================================
# Prompt
# ============================================================================

MEDICATION_EXTRACTION_PROMPT = """
You are a medical prescription extraction agent.

Your task is to analyze a medical prescription that may contain
multiple items (e.g. medications, therapeutic foods, procedures)
and extract structured data for each one.

For each identified item, extract:

Required fields:
- item_type ("medication", "food", or "procedure")
- item_name (normalized short name, without dosage, concentration, or presentation)
- item_name_complete (full name with dosage, concentration, or presentation)
- raw_prescription_text
- confidence_level ("high", "medium", or "low")
- requires_human_review (true or false)

Medication-specific fields (only if item_type = "medication"):
- pills_per_dose
- doses_per_day
- treatment_duration_days
- total_pills_required

Food-specific fields (only if item_type = "food"):
- doses_per_day
- treatment_duration_days

Rules:
- Do NOT provide medical advice or diagnosis.
- Split the prescription into distinct items using numbering,
  line breaks, or clear semantic separation.
- item_name_complete MUST preserve dosage, concentration,
  strength, and presentation exactly as written.
- item_name MUST exclude dosage, concentration, and presentation.
- Do NOT force values into fields where they do not apply.
- Use null for fields that are missing or not applicable.
- Infer values ONLY when the meaning is explicit and unambiguous
  (e.g., "cada 8 horas" = 3 doses per day).
- Classify items as:
    - "medication": a drug to be administered
    - "food": prescribed or therapeutic food/diet
    - "procedure": actions already performed or in-clinic treatments
- Set confidence_level:
    - "high" if frequency and duration are explicit
    - "medium" if minor inference was required
    - "low" if key information is missing or ambiguous
- Set requires_human_review to true if:
    - confidence_level is "low", OR
    - the item contains conditional or vague language
      (e.g. "si hay dolor", "según evolución")
- Always return a single valid JSON object.
- Do not include explanations, comments, or extra text.

Output format:
{
  "items": [
    {
      "item_type": "medication | food | procedure",
      "item_name": "string",
      "item_name_complete": "string",
      "pills_per_dose": number | null,
      "doses_per_day": number | null,
      "treatment_duration_days": number | null,
      "total_pills_required": number | null,
      "raw_prescription_text": "string",
      "confidence_level": "high | medium | low",
      "requires_human_review": boolean
    }
  ]
}
"""

# ============================================================================
# Pydantic Models
# ============================================================================


class PrescriptionItem(BaseModel):
    """A single extracted prescription item."""

    item_type: str = Field(..., description="Type: medication, food, or procedure")
    item_name: str = Field(..., description="Normalized short name")
    item_name_complete: str = Field(..., description="Full name with dosage")
    pills_per_dose: Optional[float] = Field(None, description="Pills per dose")
    doses_per_day: Optional[int] = Field(None, description="Doses per day")
    treatment_duration_days: Optional[int] = Field(None, description="Duration in days")
    total_pills_required: Optional[float] = Field(None, description="Total pills needed")
    raw_prescription_text: str = Field(..., description="Original text")
    confidence_level: str = Field(..., description="high, medium, or low")
    requires_human_review: bool = Field(..., description="Needs human review")


class ExtractionRequest(BaseModel):
    """Request to extract prescription data."""

    prescription_text: str = Field(
        ...,
        min_length=1,
        description="The raw prescription text to analyze",
        examples=["Omeoprazol 5mg Administrar via oral 1/2 tableta cada 24 horas por 4 dias"],
    )


class ExtractionResponse(BaseModel):
    """Response with extracted prescription items."""

    items: list[PrescriptionItem] = Field(..., description="List of extracted items")
    raw_response: Optional[str] = Field(None, description="Raw LLM response for debugging")


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    message: str
    details: Optional[str] = None


# ============================================================================
# Service
# ============================================================================


class PrescriptionExtractorService:
    """Service to extract prescription data using OpenAI."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize the service with OpenAI API key."""
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is required")
        self.client = OpenAI(api_key=self.api_key)

    def extract(self, prescription_text: str) -> ExtractionResponse:
        """Extract structured data from prescription text."""
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": MEDICATION_EXTRACTION_PROMPT},
                    {"role": "user", "content": prescription_text},
                ],
                response_format={"type": "json_object"},
            )

            raw_content = response.choices[0].message.content
            data = json.loads(raw_content)

            items = [PrescriptionItem(**item) for item in data.get("items", [])]

            return ExtractionResponse(items=items, raw_response=raw_content)

        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM response as JSON: {e}")
        except Exception as e:
            raise RuntimeError(f"OpenAI API error: {e}")


# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(
    title="Prescription Extractor Service",
    description="Microservice to extract structured data from prescription text using AI",
    version="1.0.0",
)

# Global service instance (lazy initialized)
_service: Optional[PrescriptionExtractorService] = None


def get_service() -> PrescriptionExtractorService:
    """Get or create the service instance."""
    global _service
    if _service is None:
        _service = PrescriptionExtractorService()
    return _service


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "prescription-extractor"}


@app.post(
    "/extract",
    response_model=ExtractionResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        500: {"model": ErrorResponse, "description": "Service error"},
    },
)
async def extract_prescription(request: ExtractionRequest) -> ExtractionResponse:
    """
    Extract structured medication data from prescription text.

    Uses OpenAI GPT-4o-mini to analyze the prescription and return
    structured data for each medication, food, or procedure found.
    """
    try:
        service = get_service()
        return service.extract(request.prescription_text)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CLI Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("EXTRACTOR_PORT", "8001"))
    print(f"Starting Prescription Extractor Service on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
