import axios from 'axios';
import type { Service } from './types/booking';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const api = axios.create({
  baseURL: `${baseURL}/api/v1/public`,
  headers: { 'Content-Type': 'application/json' },
});

export interface GetClinicServicesResponse {
  success: boolean;
  data: { services: Service[] };
}

export const getClinicServices = async (clinicId: string): Promise<Service[]> => {
  const { data } = await api.get<GetClinicServicesResponse>(
    `/clinics/${clinicId}/services`
  );
  return data.data.services;
};
