import api from './api';

export interface ProviderListItem {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  discipline?: { id: string; name: string };
  disciplines?: { discipline: { id: string; name: string } }[];
  providerServices?: {
    service: { id: string; name: string; defaultPrice: string };
  }[];
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
  discipline?: { id: string; name: string };
  disciplines?: { discipline: { id: string; name: string } }[];
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

export interface AddProviderPayload {
  firstName: string;
  lastName: string;
  email: string;
  disciplineIds: string[];
  services: { serviceId: string; priceOverride?: number }[];
}

export const addProvider = async (
  payload: AddProviderPayload,
  clinicId: string
): Promise<ProviderListItem> => {
  const body = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    disciplineIds: payload.disciplineIds,
    services: payload.services,
    clinicId,
  };
  const { data } = await api.post<{
    success: boolean;
    data: { provider: ProviderListItem };
  }>('/providers', body);
  return data.data.provider;
};

export interface CreateAvailabilityPayload {
  weekday: number;
  startTime: string;
  endTime: string;
  clinicId: string;
}

export interface CreateUnavailabilityPayload {
  date: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  clinicId: string;
}

export const createUnavailability = async (
  providerId: string,
  payload: CreateUnavailabilityPayload
): Promise<{ id: string }> => {
  const { data } = await api.post<{
    success: boolean;
    data: { unavailability: { id: string } };
  }>(`/providers/${providerId}/unavailability`, payload);
  return data.data.unavailability;
};

export const createAvailability = async (
  providerId: string,
  payload: CreateAvailabilityPayload
): Promise<ProviderAvailabilitySlot> => {
  const { data } = await api.post<{
    success: boolean;
    data: { availability: ProviderAvailabilitySlot };
  }>(`/providers/${providerId}/availability`, payload);
  return data.data.availability;
};

export interface ProviderServiceItem {
  id: string;
  serviceId: string;
  priceOverride: string | null;
  service: {
    id: string;
    name: string;
    defaultPrice: string;
    discipline?: { id: string; name: string };
  };
}

export const listProviderServices = async (
  providerId: string,
  clinicId?: string
): Promise<ProviderServiceItem[]> => {
  const params = clinicId ? `?clinicId=${encodeURIComponent(clinicId)}` : '';
  const { data } = await api.get<{
    success: boolean;
    data: { providerServices: ProviderServiceItem[] };
  }>(`/providers/${providerId}/services${params}`);
  return data.data.providerServices;
};

export const addProviderService = async (
  providerId: string,
  serviceId: string,
  clinicId: string,
  priceOverride?: number
): Promise<ProviderServiceItem> => {
  const { data } = await api.post<{
    success: boolean;
    data: { providerService: ProviderServiceItem };
  }>(`/providers/${providerId}/services`, { serviceId, priceOverride, clinicId });
  return data.data.providerService;
};

export const updateProviderService = async (
  providerId: string,
  serviceId: string,
  priceOverride: number | null,
  clinicId?: string
): Promise<ProviderServiceItem> => {
  const body = clinicId ? { priceOverride, clinicId } : { priceOverride };
  const { data } = await api.put<{
    success: boolean;
    data: { providerService: ProviderServiceItem };
  }>(`/providers/${providerId}/services/${serviceId}`, body);
  return data.data.providerService;
};

export interface UpdateProviderPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  disciplineIds?: string[];
  isActive?: boolean;
}

export const updateProvider = async (
  providerId: string,
  payload: UpdateProviderPayload,
  clinicId?: string
): Promise<ProviderListItem> => {
  const body = clinicId ? { ...payload, clinicId } : payload;
  const { data } = await api.put<{
    success: boolean;
    data: { provider: ProviderListItem };
  }>(`/providers/${providerId}`, body);
  return data.data.provider;
};

export const deactivateProvider = async (
  providerId: string,
  clinicId?: string
): Promise<ProviderListItem> => {
  const params = clinicId ? `?clinicId=${encodeURIComponent(clinicId)}` : '';
  const { data } = await api.delete<{
    success: boolean;
    data: { provider: ProviderListItem };
  }>(`/providers/${providerId}${params}`);
  return data.data.provider;
};

export const removeProviderService = async (
  providerId: string,
  serviceId: string,
  clinicId?: string
): Promise<void> => {
  const params = clinicId ? `?clinicId=${encodeURIComponent(clinicId)}` : '';
  await api.delete(`/providers/${providerId}/services/${serviceId}${params}`);
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
  const withAvailability = result as { availability?: ProviderAvailabilitySlot };
  return { availability: withAvailability.availability! };
};
