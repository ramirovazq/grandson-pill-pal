/**
 * Tests for API client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, ApiError } from "./client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("API Client", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("healthCheck", () => {
    it("should return health status", async () => {
      const mockResponse = {
        status: "healthy",
        timestamp: "2026-01-26T12:00:00Z",
        version: "1.0.0",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.healthCheck();

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/health")
      );
    });
  });

  describe("createPrescription", () => {
    it("should create a prescription", async () => {
      const mockPrescription = {
        id: "123",
        phone_number: "+15551234567",
        items: [{ id: "item-1", text: "Take 1 pill daily" }],
        language: "en",
        timezone: "UTC",
        status: "active",
        created_at: "2026-01-26T12:00:00Z",
        updated_at: "2026-01-26T12:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockPrescription),
      });

      const result = await api.createPrescription({
        phone_number: "+15551234567",
        items: [{ text: "Take 1 pill daily" }],
        language: "en",
      });

      expect(result).toEqual(mockPrescription);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/prescriptions"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("should throw ApiError on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () =>
          Promise.resolve({
            error: "validation_error",
            message: "Invalid phone number",
          }),
      });

      await expect(
        api.createPrescription({
          phone_number: "invalid",
          items: [{ text: "Take 1 pill daily" }],
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("listPrescriptions", () => {
    it("should list prescriptions", async () => {
      const mockResponse = {
        prescriptions: [],
        total: 0,
        limit: 20,
        offset: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.listPrescriptions();

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/prescriptions")
      );
    });

    it("should include query parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ prescriptions: [], total: 0, limit: 10, offset: 5 }),
      });

      await api.listPrescriptions({
        phone_number: "+15551234567",
        status: "active",
        limit: 10,
        offset: 5,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/phone_number=.*&status=active&limit=10&offset=5/)
      );
    });
  });

  describe("getPrescription", () => {
    it("should get a prescription by ID", async () => {
      const mockPrescription = {
        id: "123",
        phone_number: "+15551234567",
        items: [],
        status: "active",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockPrescription),
      });

      const result = await api.getPrescription("123");

      expect(result).toEqual(mockPrescription);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/prescriptions/123")
      );
    });

    it("should throw ApiError when not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () =>
          Promise.resolve({
            error: "not_found",
            message: "Prescription not found",
          }),
      });

      await expect(api.getPrescription("nonexistent")).rejects.toThrow(ApiError);
    });
  });

  describe("deletePrescription", () => {
    it("should delete a prescription", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await api.deletePrescription("123");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/prescriptions/123"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("updatePrescriptionStatus", () => {
    it("should update prescription status", async () => {
      const mockPrescription = {
        id: "123",
        status: "paused",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockPrescription),
      });

      const result = await api.updatePrescriptionStatus("123", "paused");

      expect(result).toEqual(mockPrescription);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/prescriptions/123/status"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "paused" }),
        })
      );
    });
  });

  describe("ApiError", () => {
    it("should have correct properties", () => {
      const error = new ApiError(404, "not_found", "Resource not found", {
        id: "123",
      });

      expect(error.status).toBe(404);
      expect(error.error).toBe("not_found");
      expect(error.message).toBe("Resource not found");
      expect(error.details).toEqual({ id: "123" });
      expect(error.name).toBe("ApiError");
    });
  });
});
