import axios from 'axios';
import api from './api';
import type { Service } from './types/booking';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const publicApi = axios.create({
  baseURL: `${baseURL}/api/v1/public`,
  headers: { 'Content-Type': 'application/json' },
});

export interface GetClinicServicesResponse {
  success: boolean;
  data: { services: Service[] };
}

export const getClinicServices = async (clinicId: string): Promise<Service[]> => {
  const { data } = await publicApi.get<GetClinicServicesResponse>(
    `/clinics/${clinicId}/services`
  );
  return data.data.services;
};

export interface DashboardService {
  id: string;
  name: string;
  duration: number;
  defaultPrice: string;
  discipline: { id: string; name: string };
}

export const getDashboardServices = async (
  clinicId?: string
): Promise<DashboardService[]> => {
  const params = clinicId ? `?clinicId=${clinicId}` : '';
  const { data } = await api.get<{
    success: boolean;
    data: { services: DashboardService[] };
  }>(`/services${params}`);
  return data.data.services;
};
