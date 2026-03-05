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

export interface ServiceWithCount extends DashboardService {
  _count?: { providerServices: number };
}

export interface CreateServicePayload {
  disciplineId: string;
  name: string;
  duration: number;
  defaultPrice: number | string;
  taxApplicable?: boolean;
}

export interface UpdateServicePayload {
  name?: string;
  duration?: number;
  defaultPrice?: number | string;
  disciplineId?: string;
  taxApplicable?: boolean;
}

export const createService = async (
  payload: CreateServicePayload,
  clinicId?: string
): Promise<ServiceWithCount> => {
  const body = clinicId ? { ...payload, clinicId } : payload;
  const { data } = await api.post<{ success: boolean; data: { service: ServiceWithCount } }>(
    '/services',
    body
  );
  return data.data.service;
};

export const updateService = async (
  id: string,
  payload: UpdateServicePayload,
  clinicId?: string
): Promise<ServiceWithCount> => {
  const params = clinicId ? `?clinicId=${clinicId}` : '';
  const { data } = await api.put<{ success: boolean; data: { service: ServiceWithCount } }>(
    `/services/${id}${params}`,
    payload
  );
  return data.data.service;
};

export const archiveService = async (
  id: string,
  clinicId?: string
): Promise<void> => {
  const params = clinicId ? `?clinicId=${clinicId}` : '';
  await api.delete(`/services/${id}${params}`);
};
