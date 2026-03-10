import api from './api';

export interface Discipline {
  id: string;
  clinicId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { providers?: number; providerDisciplines?: number };
}

export interface DisciplineCreatePayload {
  name: string;
  description?: string;
}

export interface DisciplineUpdatePayload {
  name?: string;
  description?: string;
}

interface DisciplinesResponse {
  success: boolean;
  message: string;
  data: { disciplines: Discipline[] };
}

interface DisciplineResponse {
  success: boolean;
  message: string;
  data: { discipline: Discipline };
}

export const getDisciplines = async (): Promise<Discipline[]> => {
  const { data } = await api.get<DisciplinesResponse>('/disciplines');
  return data.data.disciplines;
};

export const createDiscipline = async (
  payload: DisciplineCreatePayload
): Promise<Discipline> => {
  const { data } = await api.post<DisciplineResponse>('/disciplines', payload);
  return data.data.discipline;
};

export const updateDiscipline = async (
  id: string,
  payload: DisciplineUpdatePayload
): Promise<Discipline> => {
  const { data } = await api.put<DisciplineResponse>(`/disciplines/${id}`, payload);
  return data.data.discipline;
};

export const deleteDiscipline = async (id: string): Promise<void> => {
  await api.delete(`/disciplines/${id}`);
};
