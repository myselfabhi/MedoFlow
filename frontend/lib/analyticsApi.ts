import api from './api';

export interface AnalyticsOverview {
  totalAppointments: number;
  totalRevenue: number;
  activeTreatmentPlans: number;
  completedTreatmentPlans: number;
  completedVisits: number;
}

export const getAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
  const { data } = await api.get<{
    success: boolean;
    data: AnalyticsOverview;
  }>('/analytics/overview');
  return data.data;
};

export const getRevenueByService = async () => {
  const { data } = await api.get<{
    success: boolean;
    data: { data: { serviceName: string; total: number }[] };
  }>('/analytics/revenue-by-service');
  return data.data.data;
};

export const getRevenueByProvider = async () => {
  const { data } = await api.get<{
    success: boolean;
    data: { data: { providerName: string; total: number }[] };
  }>('/analytics/revenue-by-provider');
  return data.data.data;
};

export const getAppointmentsByDiscipline = async () => {
  const { data } = await api.get<{
    success: boolean;
    data: { data: { disciplineName: string; count: number }[] };
  }>('/analytics/appointments-by-discipline');
  return data.data.data;
};

export type AnalyticsExportType =
  | 'overview'
  | 'revenue-by-service'
  | 'revenue-by-provider'
  | 'appointments-by-discipline';

export const downloadAnalyticsReport = async (type: AnalyticsExportType) => {
  const response = await api.get(`/analytics/export?type=${type}`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `analytics-${type}.csv`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};
