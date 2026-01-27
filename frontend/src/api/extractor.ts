/**
 * API Client for Prescription Extractor Service
 *
 * Calls the AI-powered extractor microservice to analyze prescription text
 * and extract structured medication data.
 */

import { ApiError } from "./client";

// Extractor service URL - configurable via environment variable
// In production (Docker), use /extractor which nginx will proxy
// In development, use direct URL to the extractor service
const EXTRACTOR_URL = import.meta.env.VITE_EXTRACTOR_URL || 
  (import.meta.env.PROD ? "/extractor" : "http://localhost:8001");

/**
 * Extracted prescription item from the AI service
 */
export interface ExtractedItem {
  item_type: "medication" | "food" | "procedure";
  item_name: string;
  item_name_complete: string;
  pills_per_dose: number | null;
  doses_per_day: number | null;
  treatment_duration_days: number | null;
  total_pills_required: number | null;
  raw_prescription_text: string;
  confidence_level: "high" | "medium" | "low";
  requires_human_review: boolean;
}

/**
 * Response from the extractor service
 */
export interface ExtractionResponse {
  items: ExtractedItem[];
  raw_response?: string;
}

/**
 * Request to the extractor service
 */
export interface ExtractionRequest {
  prescription_text: string;
}

/**
 * Extract prescription data using the AI extractor service
 */
export async function extractPrescription(
  prescriptionText: string
): Promise<ExtractionResponse> {
  const response = await fetch(`${EXTRACTOR_URL}/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prescription_text: prescriptionText }),
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // Use default error message
    }
    throw new ApiError(response.status, "extraction_error", errorMessage);
  }

  return response.json();
}

/**
 * Check if the extractor service is healthy
 */
export async function checkExtractorHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${EXTRACTOR_URL}/health`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default {
  extractPrescription,
  checkExtractorHealth,
};
