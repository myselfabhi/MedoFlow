'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getAnalyticsDashboard, type ClinicDashboardResponse } from '@/lib/analyticsApi';
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppPageHeader,
  DateRangeFilter,
} from '@/components/ui-system';
import React, { useState } from 'react';
import type { DateRangeOption, DateRange } from '@/components/ui-system/DateRangeFilter';
import { PageContainer } from '@/components/layout';
import {
  TrendingUp,
  Users,
  CreditCard,
  Activity,
  AlertCircle,
  ArrowUpRight,
  ShoppingBag,
  Gauge,
} from 'lucide-react';
import { AppButton } from '@/components/ui-system';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  if (user && user.role !== 'SUPER_ADMIN') {
    return null;
  }

  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('ALL_TIME');
  const [dateRangeValues, setDateRangeValues] = useState<DateRange>({});
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview', dateRangeOption],
    queryFn: () => getAnalyticsDashboard({
      dateFrom: dateRangeValues.startDate?.toISOString().slice(0, 10),
      dateTo: dateRangeValues.endDate?.toISOString().slice(0, 10),
    }),
    enabled: !!user?.clinicId,
  });

  const clinicData = data?.mode === 'clinic' ? (data as ClinicDashboardResponse).dashboard : null;
  const stats = clinicData?.commandCenter;

  return (
    <PageContainer className="space-y-8">
      <AppPageHeader
        title="Command Center"
        description="High-level clinic health and financial overview"
        actions={
          <DateRangeFilter 
            value={dateRangeOption}
            onChange={(opt, range) => {
              setDateRangeOption(opt);
              setDateRangeValues(range);
            }}
          />
        }
      />

      {/* KPI Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <AppCard className="relative overflow-hidden">
          <AppCardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Revenue</p>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-900">
                ${isLoading ? '...' : stats?.finance.totalRevenue.toLocaleString()}
              </h3>
              <span className="flex items-center text-xs font-medium text-emerald-600">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                12%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">vs last 30 days</p>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Appointments</p>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-900">
                {isLoading ? '...' : stats?.operations.totalAppointments}
              </h3>
              <span className="flex items-center text-xs font-medium text-blue-600">
                <Activity className="h-3 w-3 mr-0.5" />
                Steady
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Total clinical volume</p>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Orders</p>
              <div className="p-2 bg-purple-50 rounded-lg">
                <ShoppingBag className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-900">
                {isLoading ? '...' : stats?.commerce.ordersCount ?? 0}
              </h3>
              <span className="flex items-center text-xs font-medium text-slate-500">
                checked out
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Store orders this period</p>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Clinic Optimum Capacity</p>
              <div className="p-2 bg-teal-50 rounded-lg">
                <Gauge className="h-4 w-4 text-teal-600" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-900">
                {isLoading ? '...' : (stats?.operations.clinicCapacityRate ?? 0).toFixed(1)}%
              </h3>
              <span className={cn(
                "flex items-center text-xs font-medium",
                (stats?.operations.clinicCapacityRate ?? 0) >= 70 ? "text-teal-600" : "text-amber-500"
              )}>
                {(stats?.operations.clinicCapacityRate ?? 0) >= 70 ? 'Optimal' : 'Below target'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Avg provider utilisation</p>
          </AppCardContent>
        </AppCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>Quick Actions</AppCardTitle>
          </AppCardHeader>
          <AppCardContent className="grid grid-cols-2 gap-4">
            <AppButton asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/dashboard/providers">
                <Users className="h-5 w-5" />
                Manage Providers
              </Link>
            </AppButton>
            <AppButton asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/dashboard/services">
                <Activity className="h-5 w-5" />
                Update Services
              </Link>
            </AppButton>
            <AppButton asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/dashboard/products">
                <CreditCard className="h-5 w-5" />
                Store Catalog
              </Link>
            </AppButton>
            <AppButton asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/dashboard/analytics">
                <TrendingUp className="h-5 w-5" />
                Deep Analytics
              </Link>
            </AppButton>
          </AppCardContent>
        </AppCard>

        {/* Business Alerts */}
        <AppCard className="border-l-4 border-l-amber-400 shadow-sm flex flex-col">
          <AppCardHeader>
            <AppCardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Active Alerts
            </AppCardTitle>
          </AppCardHeader>
          <AppCardContent className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {stats?.alerts.map(alert => (
              <div key={alert.id} className={cn(
                "flex items-start gap-3 p-3 rounded-lg text-sm border",
                alert.severity === 'critical' ? "bg-rose-50 text-rose-800 border-rose-100" : "bg-amber-50 text-amber-800 border-amber-100"
              )}>
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">{alert.title}</p>
                  <p>{alert.message}</p>
                </div>
              </div>
            ))}
            {(!stats?.alerts || stats.alerts.length === 0) && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-500 border border-slate-100">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                <div>
                  <p className="font-semibold">All systems normal</p>
                  <p>No critical business alerts at this time.</p>
                </div>
              </div>
            )}
          </AppCardContent>
        </AppCard>
      </div>
    </PageContainer>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
