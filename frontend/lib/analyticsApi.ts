import api from './api';

export interface AnalyticsOverview {
  totalAppointments: number;
  totalRevenue: number;
  activeTreatmentPlans: number;
  completedTreatmentPlans: number;
  completedVisits: number;
}

export const getAnalyticsOverview = async (
  clinicId?: string
): Promise<AnalyticsOverview> => {
  const params = clinicId ? `?clinicId=${clinicId}` : '';
  const { data } = await api.get<{
    success: boolean;
    data: AnalyticsOverview;
  }>(`/analytics/overview${params}`);
  return data.data;
};

export const getRevenueByService = async (clinicId?: string) => {
  const params = clinicId ? `?clinicId=${clinicId}` : '';
  const { data } = await api.get<{
    success: boolean;
    data: { data: { serviceName: string; total: number }[] };
  }>(`/analytics/revenue-by-service${params}`);
  return data.data.data;
};

export const getRevenueByProvider = async (clinicId?: string) => {
  const params = clinicId ? `?clinicId=${clinicId}` : '';
  const { data } = await api.get<{
    success: boolean;
    data: { data: { providerName: string; total: number }[] };
  }>(`/analytics/revenue-by-provider${params}`);
  return data.data.data;
};

export const getAppointmentsByDiscipline = async (clinicId?: string) => {
  const params = clinicId ? `?clinicId=${clinicId}` : '';
  const { data } = await api.get<{
    success: boolean;
    data: { data: { disciplineName: string; count: number }[] };
  }>(`/analytics/appointments-by-discipline${params}`);
  return data.data.data;
};
