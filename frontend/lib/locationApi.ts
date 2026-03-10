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

export const getLocations = async (): Promise<Location[]> => {
  const { data } = await api.get<LocationsResponse>('/locations');
  return data.data.locations;
};

export const createLocation = async (
  payload: CreateLocationPayload
): Promise<Location> => {
  const { data } = await api.post<LocationResponse>('/locations', payload);
  return data.data.location;
};
