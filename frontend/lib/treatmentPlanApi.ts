import api from './api';

// ───────────────────────── Types ─────────────────────────

export type TreatmentPlanStatus = 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED';

export interface TreatmentPlan {
    id: string;
    clinicId: string;
    patientId: string;
    providerId: string;
    disciplineId: string;
    name: string;
    totalSessions: number;
    sessionsCompleted: number;
    startDate: string;
    endDate: string | null;
    goals: unknown;
    notes: string | null;
    status: TreatmentPlanStatus;
    createdAt: string;
    updatedAt: string;
    clinic: { id: string; name: string };
    patient: { id: string; name: string; email: string };
    provider: {
        id: string;
        firstName: string;
        lastName: string;
        discipline: { id: string; name: string };
        user: { id: string; name: string };
    };
    discipline: { id: string; name: string };
}

export interface CreateTreatmentPlanPayload {
    patientId: string;
    providerId?: string; // optional for PROVIDER; backend resolves from auth
    disciplineId: string;
    name: string;
    totalSessions: number;
    startDate: string;
    endDate?: string | null;
    goals?: unknown;
    notes?: string | null;
}

export interface UpdateTreatmentPlanPayload {
    name?: string;
    totalSessions?: number;
    sessionsCompleted?: number;
    startDate?: string;
    endDate?: string | null;
    goals?: unknown;
    notes?: string | null;
}

// ───────────────────────── API ─────────────────────────

export const createTreatmentPlan = async (
    payload: CreateTreatmentPlanPayload
): Promise<TreatmentPlan> => {
    const { data } = await api.post<{
        success: boolean;
        data: { treatmentPlan: TreatmentPlan };
    }>('/treatment-plans', payload);
    return data.data.treatmentPlan;
};

export const getTreatmentPlans = async (
  clinicId: string,
  status?: 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED'
): Promise<TreatmentPlan[]> => {
  const params = new URLSearchParams({ clinicId });
  if (status) params.set('status', status);
  const { data } = await api.get<{
    success: boolean;
    data: { treatmentPlans: TreatmentPlan[] };
  }>(`/treatment-plans?${params.toString()}`);
  return data.data.treatmentPlans;
};

export const getPlansByPatient = async (
    patientId: string
): Promise<TreatmentPlan[]> => {
    const { data } = await api.get<{
        success: boolean;
        data: { treatmentPlans: TreatmentPlan[] };
    }>(`/treatment-plans/patient/${patientId}`);
    return data.data.treatmentPlans;
};

export const updateTreatmentPlan = async (
    id: string,
    payload: UpdateTreatmentPlanPayload
): Promise<TreatmentPlan> => {
    const { data } = await api.put<{
        success: boolean;
        data: { treatmentPlan: TreatmentPlan };
    }>(`/treatment-plans/${id}`, payload);
    return data.data.treatmentPlan;
};

export const completeTreatmentPlan = async (
    id: string
): Promise<TreatmentPlan> => {
    const { data } = await api.put<{
        success: boolean;
        data: { treatmentPlan: TreatmentPlan };
    }>(`/treatment-plans/${id}/complete`);
    return data.data.treatmentPlan;
};

export const discontinueTreatmentPlan = async (
    id: string
): Promise<TreatmentPlan> => {
    const { data } = await api.put<{
        success: boolean;
        data: { treatmentPlan: TreatmentPlan };
    }>(`/treatment-plans/${id}/discontinue`);
    return data.data.treatmentPlan;
};
