import axios from 'axios';
import api from './api';
import type { Location } from './types/booking';
import type { AppointmentStatus } from './patientApi';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const publicApi = axios.create({
  baseURL: `${baseURL}/api/v1/public`,
  headers: { 'Content-Type': 'application/json' },
});

export interface CheckPatientExistsResponse {
  success: boolean;
  data: { exists: boolean };
}

export interface CreateAppointmentPayload {
  clinicId: string;
  locationId: string;
  providerId: string;
  serviceId: string;
  patientId: string;
  startTime: string;
  endTime: string;
}

export interface CreatedAppointment {
  id: string;
  status: AppointmentStatus;
  slotHeldUntil?: string | null;
}

export const getClinicLocations = async (clinicId: string): Promise<Location[]> => {
  const { data } = await publicApi.get<{ success: boolean; data: { locations: Location[] } }>(
    `/clinics/${clinicId}/locations`
  );
  return data.data.locations;
};

export const checkPatientExists = async (email: string): Promise<boolean> => {
  const { data } = await publicApi.get<CheckPatientExistsResponse>(
    `/patients/check?email=${encodeURIComponent(email)}`
  );
  return data.data.exists;
};

export const createAppointment = async (
  payload: CreateAppointmentPayload
): Promise<CreatedAppointment> => {
  const { data } = await api.post<{
    success: boolean;
    data: { appointment: CreatedAppointment };
  }>('/appointments', payload);
  return data.data.appointment;
};
