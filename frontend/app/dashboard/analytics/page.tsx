'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAnalyticsOverview,
  getRevenueByService,
  getRevenueByProvider,
  getAppointmentsByDiscipline,
  downloadAnalyticsReport,
  type AnalyticsExportType,
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

const CHART_COLORS = [
  'hsl(217 91% 60%)', // accent
  'hsl(142 76% 36%)', // success
  'hsl(38 92% 50%)',  // warning
  'hsl(0 72% 51%)',   // destructive
  'hsl(215 16% 47%)', // muted
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? undefined;
  const isProvider = user?.role === 'PROVIDER';

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => getAnalyticsOverview(),
    enabled: !!clinicId,
  });

  const { data: revenueByService } = useQuery({
    queryKey: ['analytics', 'revenue-by-service'],
    queryFn: () => getRevenueByService(),
    enabled: !!clinicId && !isProvider,
  });

  const { data: revenueByProvider } = useQuery({
    queryKey: ['analytics', 'revenue-by-provider'],
    queryFn: () => getRevenueByProvider(),
    enabled: !!clinicId && !isProvider,
  });

  const { data: appointmentsByDiscipline } = useQuery({
    queryKey: ['analytics', 'appointments-by-discipline'],
    queryFn: () => getAppointmentsByDiscipline(),
    enabled: !!clinicId && !isProvider,
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AppPageHeader
        title="Analytics"
        description="Clinic performance overview"
      />
      {!isProvider && (
        <div className="flex justify-end">
          <select
            className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            defaultValue=""
            onChange={(e) => {
              const type = e.target.value as AnalyticsExportType;
              if (type) {
                void downloadAnalyticsReport(type);
                e.currentTarget.selectedIndex = 0;
              }
            }}
          >
            <option value="" disabled>
              Export report...
            </option>
            <option value="overview">Overview</option>
            <option value="revenue-by-service">Revenue by Service</option>
            <option value="revenue-by-provider">Revenue by Provider</option>
            <option value="appointments-by-discipline">
              Appointments by Discipline
            </option>
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AppCard>
          <AppCardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </h3>
          </AppCardHeader>
          <AppCardContent>
            <p className="text-2xl font-semibold text-foreground">
              ${overview?.totalRevenue?.toFixed(2) ?? '0.00'}
            </p>
          </AppCardContent>
        </AppCard>
        <AppCard>
          <AppCardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Appointments
            </h3>
          </AppCardHeader>
          <AppCardContent>
            <p className="text-2xl font-semibold text-foreground">
              {overview?.totalAppointments ?? 0}
            </p>
          </AppCardContent>
        </AppCard>
        <AppCard>
          <AppCardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Active Treatment Plans
            </h3>
          </AppCardHeader>
          <AppCardContent>
            <p className="text-2xl font-semibold text-foreground">
              {overview?.activeTreatmentPlans ?? 0}
            </p>
          </AppCardContent>
        </AppCard>
        <AppCard>
          <AppCardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Completed Visits
            </h3>
          </AppCardHeader>
          <AppCardContent>
            <p className="text-2xl font-semibold text-foreground">
              {overview?.completedVisits ?? 0}
            </p>
          </AppCardContent>
        </AppCard>
      </div>

      {!isProvider && <div className="grid gap-6 lg:grid-cols-2">
        <AppCard>
          <AppCardHeader>
            <h2 className="text-lg font-semibold text-foreground">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="serviceName"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      formatter={(v: number) => [
                        `$${v.toFixed(2)}`,
                        'Revenue',
                      ]}
                    />
                    <Bar
                      dataKey="total"
                      fill="hsl(var(--accent))"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No revenue data
                </div>
              )}
            </div>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader>
            <h2 className="text-lg font-semibold text-foreground">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="providerName"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      formatter={(v: number) => [
                        `$${v.toFixed(2)}`,
                        'Revenue',
                      ]}
                    />
                    <Bar
                      dataKey="total"
                      fill="hsl(var(--success))"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No revenue data
                </div>
              )}
            </div>
          </AppCardContent>
        </AppCard>
      </div>}

      {!isProvider && <AppCard>
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
      </AppCard>}
    </div>
  );
}
