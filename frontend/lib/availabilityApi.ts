import api from './api';

export interface ProviderListItem {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  discipline: { id: string; name: string };
}

export const listProviders = async (
  clinicId?: string
): Promise<ProviderListItem[]> => {
  const params = clinicId ? `?clinicId=${encodeURIComponent(clinicId)}` : '';
  const { data } = await api.get<{
    success: boolean;
    data: { providers: ProviderListItem[] };
  }>(`/providers${params}`);
  return data.data.providers;
};

export interface ProviderAvailabilitySlot {
  id: string;
  providerId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderWithAvailability {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  discipline: { id: string; name: string };
  providerAvailability: ProviderAvailabilitySlot[];
}

export interface UpdateAvailabilityPayload {
  weekday?: number;
  startTime?: string;
  endTime?: string;
  clinicId?: string;
}

export type UpdateAvailabilityResult =
  | { availability: ProviderAvailabilitySlot }
  | {
      requiresConfirmation: true;
      affectedCount: number;
      affectedAppointmentIds: string[];
    };

export const getProvider = async (
  providerId: string,
  clinicId?: string
): Promise<ProviderWithAvailability> => {
  const params = clinicId ? `?clinicId=${encodeURIComponent(clinicId)}` : '';
  const { data } = await api.get<{
    success: boolean;
    data: { provider: ProviderWithAvailability };
  }>(`/providers/${providerId}${params}`);
  return data.data.provider;
};

export const updateAvailability = async (
  providerId: string,
  availabilityId: string,
  payload: UpdateAvailabilityPayload,
  options?: { force?: boolean }
): Promise<UpdateAvailabilityResult> => {
  const body = { ...payload, ...(options?.force && { force: true }) };
  const { data } = await api.put<{
    success: boolean;
    data: { availability?: ProviderAvailabilitySlot } | {
      requiresConfirmation: true;
      affectedCount: number;
      affectedAppointmentIds: string[];
    };
  }>(`/providers/${providerId}/availability/${availabilityId}`, body);
  const result = data.data;
  if ('requiresConfirmation' in result && result.requiresConfirmation) {
    return result;
  }
  return { availability: result.availability! };
};
