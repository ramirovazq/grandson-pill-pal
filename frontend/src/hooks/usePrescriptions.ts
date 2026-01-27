/**
 * React Query hooks for prescription API operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/api";
import type {
  CreatePrescriptionRequest,
  Prescription,
  PrescriptionList,
  PrescriptionStatus,
} from "@/api";

// Query keys
export const prescriptionKeys = {
  all: ["prescriptions"] as const,
  lists: () => [...prescriptionKeys.all, "list"] as const,
  list: (filters: { phone_number?: string; status?: PrescriptionStatus }) =>
    [...prescriptionKeys.lists(), filters] as const,
  details: () => [...prescriptionKeys.all, "detail"] as const,
  detail: (id: string) => [...prescriptionKeys.details(), id] as const,
  reminders: (id: string) => [...prescriptionKeys.detail(id), "reminders"] as const,
};

/**
 * Hook to fetch list of prescriptions
 */
export function usePrescriptions(params?: {
  phone_number?: string;
  status?: PrescriptionStatus;
  limit?: number;
  offset?: number;
}) {
  return useQuery<PrescriptionList, ApiError>({
    queryKey: prescriptionKeys.list(params || {}),
    queryFn: () => api.listPrescriptions(params),
  });
}

/**
 * Hook to fetch a single prescription
 */
export function usePrescription(id: string) {
  return useQuery<Prescription, ApiError>({
    queryKey: prescriptionKeys.detail(id),
    queryFn: () => api.getPrescription(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new prescription
 */
export function useCreatePrescription() {
  const queryClient = useQueryClient();

  return useMutation<Prescription, ApiError, CreatePrescriptionRequest>({
    mutationFn: (data) => api.createPrescription(data),
    onSuccess: () => {
      // Invalidate prescription list queries to refetch
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
    },
  });
}

/**
 * Hook to update a prescription
 */
export function useUpdatePrescription() {
  const queryClient = useQueryClient();

  return useMutation<
    Prescription,
    ApiError,
    { id: string; data: Partial<CreatePrescriptionRequest> }
  >({
    mutationFn: ({ id, data }) => api.updatePrescription(id, data),
    onSuccess: (data) => {
      // Update the cache for this specific prescription
      queryClient.setQueryData(prescriptionKeys.detail(data.id), data);
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
    },
  });
}

/**
 * Hook to delete a prescription
 */
export function useDeletePrescription() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => api.deletePrescription(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: prescriptionKeys.detail(id) });
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
    },
  });
}

/**
 * Hook to update prescription status
 */
export function useUpdatePrescriptionStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    Prescription,
    ApiError,
    { id: string; status: PrescriptionStatus }
  >({
    mutationFn: ({ id, status }) => api.updatePrescriptionStatus(id, status),
    onSuccess: (data) => {
      // Update the cache
      queryClient.setQueryData(prescriptionKeys.detail(data.id), data);
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
    },
  });
}

/**
 * Hook to fetch reminders for a prescription
 */
export function usePrescriptionReminders(prescriptionId: string) {
  return useQuery({
    queryKey: prescriptionKeys.reminders(prescriptionId),
    queryFn: () => api.getPrescriptionReminders(prescriptionId),
    enabled: !!prescriptionId,
  });
}
