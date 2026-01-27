/**
 * API Client for Grandson Pill Pal Backend
 *
 * Base URL is configured via environment variable VITE_API_URL
 * Defaults to http://localhost:8000/api/v1 for development
 */

import type {
  CreatePrescriptionRequest,
  UpdatePrescriptionRequest,
  Prescription,
  PrescriptionList,
  PrescriptionStatus,
  ReminderList,
  ReminderStatus,
  HealthResponse,
  ErrorResponse,
} from "./types";

// API Base URL - configurable via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public error: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Helper function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        error: "unknown_error",
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    throw new ApiError(
      response.status,
      errorData.error,
      errorData.message,
      errorData.details
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * API Client object with all endpoints
 */
export const api = {
  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<HealthResponse>(response);
  },

  /**
   * Create a new prescription
   */
  async createPrescription(data: CreatePrescriptionRequest): Promise<Prescription> {
    const response = await fetch(`${API_BASE_URL}/prescriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Prescription>(response);
  },

  /**
   * List all prescriptions with optional filters
   */
  async listPrescriptions(params?: {
    phone_number?: string;
    status?: PrescriptionStatus;
    limit?: number;
    offset?: number;
  }): Promise<PrescriptionList> {
    const searchParams = new URLSearchParams();
    if (params?.phone_number) searchParams.set("phone_number", params.phone_number);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());

    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/prescriptions?${queryString}`
      : `${API_BASE_URL}/prescriptions`;

    const response = await fetch(url);
    return handleResponse<PrescriptionList>(response);
  },

  /**
   * Get a prescription by ID
   */
  async getPrescription(id: string): Promise<Prescription> {
    const response = await fetch(`${API_BASE_URL}/prescriptions/${id}`);
    return handleResponse<Prescription>(response);
  },

  /**
   * Update a prescription
   */
  async updatePrescription(
    id: string,
    data: UpdatePrescriptionRequest
  ): Promise<Prescription> {
    const response = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Prescription>(response);
  },

  /**
   * Delete a prescription
   */
  async deletePrescription(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
      method: "DELETE",
    });
    return handleResponse<void>(response);
  },

  /**
   * Update prescription status
   */
  async updatePrescriptionStatus(
    id: string,
    status: PrescriptionStatus
  ): Promise<Prescription> {
    const response = await fetch(`${API_BASE_URL}/prescriptions/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Prescription>(response);
  },

  /**
   * Get reminders for a prescription
   */
  async getPrescriptionReminders(
    prescriptionId: string,
    status?: ReminderStatus
  ): Promise<ReminderList> {
    const searchParams = new URLSearchParams();
    if (status) searchParams.set("status", status);

    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/prescriptions/${prescriptionId}/reminders?${queryString}`
      : `${API_BASE_URL}/prescriptions/${prescriptionId}/reminders`;

    const response = await fetch(url);
    return handleResponse<ReminderList>(response);
  },
};

export default api;
