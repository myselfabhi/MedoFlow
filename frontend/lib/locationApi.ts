import api from './api';

export interface Location {
  id: string;
  clinicId: string;
  name: string;
  address: string | null;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationPayload {
  name: string;
  address?: string;
  timezone: string;
}

interface LocationsResponse {
  success: boolean;
  message: string;
  data: { locations: Location[] };
}

interface LocationResponse {
  success: boolean;
  message: string;
  data: { location: Location };
}

export const getLocations = async (clinicId?: string): Promise<Location[]> => {
  const { data } = await api.get<LocationsResponse>('/locations', {
    params: clinicId ? { clinicId } : undefined,
  });
  return data.data.locations;
};

export const createLocation = async (
  payload: CreateLocationPayload,
  clinicId?: string
): Promise<Location> => {
  const body = clinicId ? { ...payload, clinicId } : payload;
  const { data } = await api.post<LocationResponse>('/locations', body);
  return data.data.location;
};
