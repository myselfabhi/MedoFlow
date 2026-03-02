import axios from 'axios';
import type { Provider, TimeSlot } from './types/booking';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const api = axios.create({
  baseURL: `${baseURL}/api/v1/public`,
  headers: { 'Content-Type': 'application/json' },
});

export interface GetClinicProvidersResponse {
  success: boolean;
  data: { providers: Provider[] };
}

export interface GetAvailabilityResponse {
  success: boolean;
  data: { slots: TimeSlot[] };
}

export const getClinicProviders = async (clinicId: string): Promise<Provider[]> => {
  const { data } = await api.get<GetClinicProvidersResponse>(
    `/clinics/${clinicId}/providers`
  );
  return data.data.providers;
};

export const getAvailability = async (
  clinicId: string,
  serviceId: string,
  date: string,
  providerId?: string
): Promise<TimeSlot[]> => {
  const params = new URLSearchParams({ clinicId, serviceId, date });
  if (providerId) params.set('providerId', providerId);
  const { data } = await api.get<GetAvailabilityResponse>(
    `/availability?${params}`
  );
  return data.data.slots;
};
