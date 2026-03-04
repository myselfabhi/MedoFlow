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
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
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

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? undefined;

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview', clinicId],
    queryFn: () => getAnalyticsOverview(clinicId),
    enabled: !!clinicId || user?.role === 'SUPER_ADMIN',
  });

  const { data: revenueByService } = useQuery({
    queryKey: ['analytics', 'revenue-by-service', clinicId],
    queryFn: () => getRevenueByService(clinicId),
    enabled: !!clinicId || user?.role === 'SUPER_ADMIN',
  });

  const { data: revenueByProvider } = useQuery({
    queryKey: ['analytics', 'revenue-by-provider', clinicId],
    queryFn: () => getRevenueByProvider(clinicId),
    enabled: !!clinicId || user?.role === 'SUPER_ADMIN',
  });

  const { data: appointmentsByDiscipline } = useQuery({
    queryKey: ['analytics', 'appointments-by-discipline', clinicId],
    queryFn: () => getAppointmentsByDiscipline(clinicId),
    enabled: !!clinicId || user?.role === 'SUPER_ADMIN',
  });

  const pieData =
    appointmentsByDiscipline?.map((d, i) => ({
      name: d.disciplineName,
      value: d.count,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    })) ?? [];

  if (overviewLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Clinic performance overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              ${overview?.totalRevenue?.toFixed(2) ?? '0.00'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Appointments</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {overview?.totalAppointments ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-500">Active Treatment Plans</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {overview?.activeTreatmentPlans ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-500">Completed Visits</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {overview?.completedVisits ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Revenue by Service</h2>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {revenueByService && revenueByService.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByService} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="serviceName" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']} />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  No revenue data
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Revenue by Provider</h2>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {revenueByProvider && revenueByProvider.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByProvider} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="providerName" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']} />
                    <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  No revenue data
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Appointments by Discipline</h2>
        </CardHeader>
        <CardContent>
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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'Appointments']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                No appointment data
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
