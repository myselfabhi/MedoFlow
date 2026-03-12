import api from './api';

export interface AnalyticsRange {
  dateFrom: string;
  dateTo: string;
}

export interface BusinessAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
}

export interface ProviderUtilizationRow {
  provider: { id: string; firstName: string; lastName: string };
  scheduledMinutes: number;
  availableMinutes: number;
  utilizationRate: number;
  completedAppointments: number;
  cancellationCount: number;
  noShowCount: number;
}

export interface ClinicDashboardResponse {
  mode: 'clinic';
  dashboard: {
    range: AnalyticsRange;
    comparison: {
      previousRange: AnalyticsRange;
      netCollectedRevenueChangePercent: number | null;
      outstandingReceivablesChangePercent: number | null;
    };
    commandCenter: {
      finance: {
        totalRevenue: number;
        collectedRevenue: number;
        netCollectedRevenue: number;
        refundedAmount: number;
        outstandingReceivables: number;
        averageRevenuePerPatient: number;
        averageRevenuePerVisit: number;
      };
      operations: {
        totalAppointments: number;
        completedAppointments: number;
        cancellationRate: number;
        noShowRate: number;
        averageAppointmentDuration: number;
        upcomingLoadCount: number;
        waitlistCount: number;
        waitlistBookedCount: number;
        waitlistConversionRate: number;
      };
      commerce: {
        productRevenue: number;
        packageRevenue: number;
        membershipRevenue: number;
        attachRate: number;
        topProducts: Array<{ productId: string; productName: string; revenue: number; quantity: number }>;
      };
      memberships: {
        activeCount: number;
        trialingCount: number;
        pastDueCount: number;
        canceledCount: number;
        endedCount: number;
        churnRate: number;
      };
      packages: {
        activeCount: number;
        exhaustedCount: number;
        expiringSoonCount: number;
        totalSessions: number;
        usedSessions: number;
        utilizationRate: number;
      };
      commissions: {
        owed: number;
        paid: number;
        pendingCount: number;
        totalCount: number;
      };
      patients: {
        distinctPatients: number;
        averageVisitsPerPatient: number;
        repeatVisitRate: number;
        inactivePatients: number;
        dropOffRiskCount: number;
        topPatientsByValue: Array<{ patientId: string; patientName: string; lifetimeValue: number }>;
      };
      providerUtilization: ProviderUtilizationRow[];
      topServices: Array<{ serviceId: string; serviceName: string; revenue: number; count: number }>;
      topProviders: Array<{ providerId: string; providerName: string; revenue: number; completedAppointments: number }>;
      alerts: BusinessAlert[];
    };
  };
}

export interface ProviderDashboardResponse {
  mode: 'provider';
  providerAnalytics: {
    range: AnalyticsRange;
    provider: { id: string; firstName: string; lastName: string } | null;
    performance: {
      completedAppointments: number;
      totalAppointments: number;
      cancellationCount: number;
      noShowCount: number;
      revenueGenerated: number;
      averageRevenuePerVisit: number;
      followUpConversionRate: number;
      repeatPatientRate: number;
      utilizationRate: number;
      scheduledMinutes: number;
      availableMinutes: number;
    };
    commissions: {
      owed: number;
      paid: number;
      pendingCount: number;
      totalCount: number;
    };
    topServices: Array<{ serviceId: string; serviceName: string; revenue: number; count: number }>;
  };
}

export type DashboardPayload = ClinicDashboardResponse | ProviderDashboardResponse;

export const getAnalyticsDashboard = async (params?: {
  dateFrom?: string;
  dateTo?: string;
  providerId?: string;
  serviceId?: string;
  disciplineId?: string;
}): Promise<DashboardPayload> => {
  const { data } = await api.get<{ success: boolean; data: DashboardPayload }>('/analytics/dashboard', {
    params,
  });
  return data.data;
};

export const getProviderSelfAnalytics = async (params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<ProviderDashboardResponse['providerAnalytics']> => {
  const { data } = await api.get<{
    success: boolean;
    data: { providerAnalytics: ProviderDashboardResponse['providerAnalytics'] };
  }>('/analytics/provider-self', { params });
  return data.data.providerAnalytics;
};

export type AnalyticsExportType =
  | 'command-center'
  | 'provider'
  | 'finance'
  | 'commerce'
  | 'patients'
  | 'commissions';

export const downloadAnalyticsReport = async (
  type: AnalyticsExportType,
  params?: { dateFrom?: string; dateTo?: string; providerId?: string }
) => {
  const response = await api.get('/analytics/export', {
    params: { type, ...params },
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
