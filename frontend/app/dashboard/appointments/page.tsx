'use client';

import React, { useState } from 'react';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMyAppointments,
  getProviderAppointments,
  getClinicAppointments,
  type PatientAppointment,
  type ProviderAppointment,
} from '@/lib/patientApi';
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppButton,
  AppPageHeader,
  AppEmptyState,
  AppTable,
  KPIStatCard,
  DateRangeFilter,
} from '@/components/ui-system';
import type { DateRangeOption, DateRange } from '@/components/ui-system/DateRangeFilter';
import { PageContainer } from '@/components/layout';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Calendar, User, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const isProvider = user?.role === 'PROVIDER';
  const isPatient = user?.role === 'PATIENT';
  const isStaffOrAdmin = user?.role === 'FRONT_DESK' || user?.role === 'SUPER_ADMIN' || user?.role === 'STAFF';

  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('ALL_TIME');
  const [dateRangeValues, setDateRangeValues] = useState<DateRange>({});

  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ['appointments', user?.role, dateRangeOption],
    queryFn: async () => {
      const { startDate, endDate } = dateRangeValues;
      if (isPatient) return getMyAppointments(startDate, endDate);
      if (isProvider) return getProviderAppointments(startDate, endDate);
      if (isStaffOrAdmin) return getClinicAppointments(startDate, endDate);
      return [] as (PatientAppointment | ProviderAppointment)[];
    },
    enabled: isPatient || isProvider || (isStaffOrAdmin && !!user?.clinicId),
  });

  const subtitle = isPatient
    ? 'View and manage your upcoming visits and care history.'
    : 'Clinical schedule and appointment management console.';

  return (
    <PageContainer className="space-y-8">
      <AppPageHeader
        title="Clinical Schedule"
        description={subtitle}
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KPIStatCard 
          label="Total Bookings"
          value={appointments.length}
          icon={Calendar}
          iconClassName="text-blue-600 bg-blue-50"
        />
        <KPIStatCard 
          label="Completed Visits"
          value={appointments.filter(a => a.status === 'COMPLETED').length}
          icon={CheckCircle2}
          iconClassName="text-emerald-600 bg-emerald-50"
        />
        <KPIStatCard 
          label="Pending Items"
          value={appointments.filter(a => a.status.includes('PENDING')).length}
          icon={AlertCircle}
          iconClassName="text-amber-600 bg-amber-50"
        />
      </div>

      <AppCard className="border-none shadow-sm overflow-hidden bg-white">
        <AppCardHeader className="bg-white border-b-0 py-6 px-8 flex items-center justify-between">
          <AppCardTitle className="text-lg font-bold">Appointment Registry</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12">
              <AppEmptyState
                title="No appointments found"
                description={isPatient ? 'Book your first visit to get started.' : 'The clinical schedule is currently empty.'}
                actionLabel={isPatient ? 'Book Appointment' : undefined}
                onAction={isPatient ? () => window.location.assign('/') : undefined}
              />
            </div>
          ) : (
            <AppTable
              columns={[
                {
                  key: 'service',
                  header: 'Visit Details',
                  render: (apt) => (
                    <div>
                      <p className="font-bold text-slate-900">{apt.service.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> {formatDateTime(apt.startTime)}</p>
                    </div>
                  ),
                },
                {
                  key: 'party',
                  header: isPatient ? 'Provider' : 'Patient',
                  render: (apt) => (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                        {isPatient ? (apt as any).provider?.lastName?.[0] : (apt as any).patient?.name?.[0]}
                      </div>
                      <p className="text-sm font-medium text-slate-700">
                        {isPatient ? `Dr. ${(apt as any).provider?.lastName}` : (apt as any).patient?.name}
                      </p>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (apt) => <StatusBadge status={apt.status} variant="appointment" />,
                },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right',
                  render: (apt) => (
                    <div className="flex justify-end pr-4">
                      <AppButton variant="ghost" size="sm" className="rounded-full font-bold text-primary-600" asChild>
                        <Link href={`/dashboard/provider/appointments/${apt.id}`}>
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </AppButton>
                    </div>
                  ),
                }
              ]}
              data={appointments.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())}
              keyExtractor={(apt) => apt.id}
            />
          )}
        </AppCardContent>
      </AppCard>
    </PageContainer>
  );
}
