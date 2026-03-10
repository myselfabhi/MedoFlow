'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAnalyticsOverview,
  getRevenueByService,
  getRevenueByProvider,
  getAppointmentsByDiscipline,
} from '@/lib/analyticsApi';
import {
  AppCard,
  AppCardHeader,
  AppCardContent,
  AppPageHeader,
  AppEmptyState,
} from '@/components/ui-system';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#64748B'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? undefined;

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => getAnalyticsOverview(),
    enabled: !!clinicId,
  });

  const { data: revenueByService } = useQuery({
    queryKey: ['analytics', 'revenue-by-service'],
    queryFn: () => getRevenueByService(),
    enabled: !!clinicId,
  });

  const { data: revenueByProvider } = useQuery({
    queryKey: ['analytics', 'revenue-by-provider'],
    queryFn: () => getRevenueByProvider(),
    enabled: !!clinicId,
  });

  const { data: appointmentsByDiscipline } = useQuery({
    queryKey: ['analytics', 'appointments-by-discipline'],
    queryFn: () => getAppointmentsByDiscipline(),
    enabled: !!clinicId,
  });

  const pieData =
    appointmentsByDiscipline?.map((d, i) => ({
      name: d.disciplineName,
      value: d.count,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    })) ?? [];

  if (!clinicId) {
    return (
      <div className="space-y-6">
        <AppPageHeader
          title="Analytics"
          description="Clinic performance overview"
        />
        <AppEmptyState
          title="No clinic assigned"
          description="You are not assigned to a clinic. Contact your administrator."
        />
      </div>
    );
  }

  if (overviewLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AppPageHeader
        title="Analytics"
        description="Clinic performance overview"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AppCard>
          <AppCardHeader className="pb-2">
            <h3 className="text-sm font-medium text-slate-500">
              Total Revenue
            </h3>
          </AppCardHeader>
          <AppCardContent>
            <p className="text-2xl font-semibold text-slate-900">
              ${overview?.totalRevenue?.toFixed(2) ?? '0.00'}
            </p>
          </AppCardContent>
        </AppCard>
        <AppCard>
          <AppCardHeader className="pb-2">
            <h3 className="text-sm font-medium text-slate-500">
              Total Appointments
            </h3>
          </AppCardHeader>
          <AppCardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {overview?.totalAppointments ?? 0}
            </p>
          </AppCardContent>
        </AppCard>
        <AppCard>
          <AppCardHeader className="pb-2">
            <h3 className="text-sm font-medium text-slate-500">
              Active Treatment Plans
            </h3>
          </AppCardHeader>
          <AppCardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {overview?.activeTreatmentPlans ?? 0}
            </p>
          </AppCardContent>
        </AppCard>
        <AppCard>
          <AppCardHeader className="pb-2">
            <h3 className="text-sm font-medium text-slate-500">
              Completed Visits
            </h3>
          </AppCardHeader>
          <AppCardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {overview?.completedVisits ?? 0}
            </p>
          </AppCardContent>
        </AppCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AppCard>
          <AppCardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Revenue by Service
            </h2>
          </AppCardHeader>
          <AppCardContent>
            <div className="h-64">
              {revenueByService && revenueByService.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueByService}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="serviceName"
                      tick={{ fontSize: 12, fill: '#64748B' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#64748B' }}
                    />
                    <Tooltip
                      formatter={(v: number) => [
                        `$${v.toFixed(2)}`,
                        'Revenue',
                      ]}
                    />
                    <Bar
                      dataKey="total"
                      fill="#2563EB"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-600">
                  No revenue data
                </div>
              )}
            </div>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Revenue by Provider
            </h2>
          </AppCardHeader>
          <AppCardContent>
            <div className="h-64">
              {revenueByProvider && revenueByProvider.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueByProvider}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="providerName"
                      tick={{ fontSize: 12, fill: '#64748B' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#64748B' }}
                    />
                    <Tooltip
                      formatter={(v: number) => [
                        `$${v.toFixed(2)}`,
                        'Revenue',
                      ]}
                    />
                    <Bar
                      dataKey="total"
                      fill="#16A34A"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-600">
                  No revenue data
                </div>
              )}
            </div>
          </AppCardContent>
        </AppCard>
      </div>

      <AppCard>
        <AppCardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            Appointments by Discipline
          </h2>
        </AppCardHeader>
        <AppCardContent>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'Appointments']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-600">
                No appointment data
              </div>
            )}
          </div>
        </AppCardContent>
      </AppCard>
    </div>
  );
}
