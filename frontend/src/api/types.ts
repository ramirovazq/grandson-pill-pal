/**
 * API Types based on OpenAPI specification
 * See backend/openapi.yaml for the full specification
 */

// Enums
export type PrescriptionStatus = "active" | "paused" | "completed" | "cancelled";
export type ReminderStatus = "pending" | "sent" | "failed" | "cancelled";
export type HealthStatus = "healthy" | "degraded" | "unhealthy";
export type Language = "en" | "es";

// Reminder Schedule
export interface ReminderSchedule {
  times?: string[];
  days_of_week?: number[];
}

// Item Type
export type ItemType = "medication" | "food" | "procedure";
export type ConfidenceLevel = "high" | "medium" | "low";

// Prescription Item Input (for creating/updating)
export interface PrescriptionItemInput {
  text: string;
  item_type?: ItemType;
  item_name?: string;
  item_name_complete?: string;
  pills_per_dose?: number | null;
  doses_per_day?: number | null;
  treatment_duration_days?: number | null;
  total_pills_required?: number | null;
  raw_prescription_text?: string;
  confidence_level?: ConfidenceLevel;
  requires_human_review?: boolean;
  schedule?: ReminderSchedule;
}

// Prescription Item (returned from API)
export interface PrescriptionItem {
  id: string;
  text: string;
  item_type?: ItemType;
  item_name?: string;
  item_name_complete?: string;
  pills_per_dose?: number | null;
  doses_per_day?: number | null;
  treatment_duration_days?: number | null;
  total_pills_required?: number | null;
  raw_prescription_text?: string;
  confidence_level?: ConfidenceLevel;
  requires_human_review?: boolean;
  schedule?: ReminderSchedule;
}

// Create Prescription Request
export interface CreatePrescriptionRequest {
  phone_number: string;
  items: PrescriptionItemInput[];
  language?: Language;
  timezone?: string;
  recipient_name?: string;
}

// Update Prescription Request
export interface UpdatePrescriptionRequest {
  phone_number?: string;
  items?: PrescriptionItemInput[];
  language?: Language;
  timezone?: string;
  recipient_name?: string;
}

// Prescription (returned from API)
export interface Prescription {
  id: string;
  phone_number: string;
  items: PrescriptionItem[];
  language: Language;
  timezone: string;
  recipient_name?: string;
  status: PrescriptionStatus;
  created_at: string;
  updated_at: string;
}

// Prescription List Response
export interface PrescriptionList {
  prescriptions: Prescription[];
  total: number;
  limit: number;
  offset: number;
}

// Reminder
export interface Reminder {
  id: string;
  prescription_id: string;
  item_id: string;
  message?: string;
  scheduled_at: string;
  sent_at?: string;
  status: ReminderStatus;
}

// Reminder List Response
export interface ReminderList {
  reminders: Reminder[];
  total: number;
}

// Health Response
export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  version?: string;
}

// Error Response
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

// Validation Error Response
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationErrorResponse {
  error: string;
  message: string;
  details: ValidationErrorDetail[];
}
