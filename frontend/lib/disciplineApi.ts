import api from './api';

export interface Discipline {
  id: string;
  clinicId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { providers: number };
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

export const getDisciplines = async (clinicId?: string): Promise<Discipline[]> => {
  const params = clinicId ? { clinicId } : {};
  const { data } = await api.get<DisciplinesResponse>('/disciplines', { params });
  return data.data.disciplines;
};

export const createDiscipline = async (
  payload: DisciplineCreatePayload,
  clinicId?: string
): Promise<Discipline> => {
  const body = clinicId ? { ...payload, clinicId } : payload;
  const { data } = await api.post<DisciplineResponse>('/disciplines', body);
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
