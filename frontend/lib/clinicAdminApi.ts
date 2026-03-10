import api from './api';

export interface ClinicAdminSummary {
  id: string;
  name: string;
  email: string;
  subscriptionPlan: string;
  launchLocation: {
    id: string;
    name: string;
    address: string | null;
    timezone: string;
  } | null;
  stats: {
    providerCount: number;
    staffCount: number;
    locationCount: number;
  };
}

export interface ClinicSetupPayload {
  name: string;
  email: string;
  location: {
    id?: string;
    name: string;
    address?: string;
    timezone: string;
  };
}

export const getCurrentClinic = async (): Promise<ClinicAdminSummary | null> => {
  const { data } = await api.get<{
    success: boolean;
    data: { clinic: ClinicAdminSummary | null };
  }>('/clinics/current');
  return data.data.clinic;
};

export const setupClinic = async (
  payload: ClinicSetupPayload
): Promise<ClinicAdminSummary> => {
  const { data } = await api.post<{
    success: boolean;
    data: { clinic: ClinicAdminSummary };
  }>('/clinics/setup', payload);
  return data.data.clinic;
};

export const updateClinic = async (payload: {
  name?: string;
  email?: string;
}) => {
  const { data } = await api.put<{
    success: boolean;
    data: { clinic: { id: string; name: string; email: string } };
  }>('/clinics/current', payload);
  return data.data.clinic;
};

export const upsertLaunchLocation = async (payload: {
  id?: string;
  name: string;
  address?: string;
  timezone: string;
}) => {
  const { data } = await api.put<{
    success: boolean;
    data: {
      location: {
        id: string;
        name: string;
        address: string | null;
        timezone: string;
      };
    };
  }>('/clinics/current/launch-location', payload);
  return data.data.location;
};
