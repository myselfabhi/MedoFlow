import api from './api';
import type { AppointmentStatus } from './patientApi';

export type RecurringFrequency = 'WEEKLY';

export interface CreateRecurringSeriesPayload {
  clinicId: string;
  locationId: string;
  providerId: string;
  serviceId: string;
  patientId: string;
  startTime: string;
  endTime: string;
  frequency: RecurringFrequency;
  numberOfSessions?: number;
  endDate?: string | null;
}

export interface CreatedAppointmentRecurring {
  id: string;
  status: AppointmentStatus;
  slotHeldUntil?: string | null;
}

export interface RecurringConflict {
  date: string;
  reason: string;
}

export interface CreateRecurringSeriesResponse {
  appointments: CreatedAppointmentRecurring[];
  conflicts: RecurringConflict[];
}

export const createRecurringSeries = async (
  payload: CreateRecurringSeriesPayload
): Promise<CreateRecurringSeriesResponse> => {
  const { data } = await api.post<{
    success: boolean;
    data: CreateRecurringSeriesResponse;
  }>('/appointments/recurring', payload);
  return data.data;
};
