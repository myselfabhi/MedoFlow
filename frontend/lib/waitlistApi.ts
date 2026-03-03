import api from './api';

export type WaitlistStatus = 'WAITING' | 'OFFERED' | 'BOOKED' | 'EXPIRED';

export interface WaitlistEntry {
  id: string;
  clinicId: string;
  providerId: string;
  serviceId: string;
  patientId: string;
  preferredDate: string;
  preferredStartTime: string;
  preferredEndTime: string;
  status: WaitlistStatus;
  offeredAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  clinic: { id: string; name: string };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    discipline: { id: string; name: string };
    user: { id: string; name: string } | null;
  };
  service: { id: string; name: string; duration?: number };
}

export interface AddToWaitlistPayload {
  clinicId: string;
  providerId: string;
  serviceId: string;
  preferredDate: string;
  preferredStartTime: string;
  preferredEndTime: string;
  patientId?: string;
}

export const addToWaitlist = async (
  payload: AddToWaitlistPayload
): Promise<WaitlistEntry> => {
  const { data } = await api.post<{
    success: boolean;
    data: { entry: WaitlistEntry };
  }>('/waitlist', payload);
  return data.data.entry;
};

export const getMyWaitlist = async (
  clinicId?: string
): Promise<WaitlistEntry[]> => {
  const params = clinicId ? `?clinicId=${encodeURIComponent(clinicId)}` : '';
  const { data } = await api.get<{
    success: boolean;
    data: { entries: WaitlistEntry[] };
  }>(`/waitlist/my${params}`);
  return data.data.entries;
};

export interface ClaimWaitlistResponse {
  entry: WaitlistEntry;
  appointment: unknown;
}

export const claimWaitlistOffer = async (
  entryId: string
): Promise<ClaimWaitlistResponse> => {
  const { data } = await api.post<{
    success: boolean;
    data: ClaimWaitlistResponse;
  }>(`/waitlist/${entryId}/claim`);
  return data.data;
};
