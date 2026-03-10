'use client';

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
} from '@/components/ui-system';
import { StatusBadge } from '@/components/common/StatusBadge';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const isProvider = user?.role === 'PROVIDER';
  const isPatient = user?.role === 'PATIENT';
  const isStaffOrAdmin =
    user?.role === 'FRONT_DESK' || user?.role === 'SUPER_ADMIN';

  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ['appointments', user?.role],
    queryFn: async () => {
      if (isPatient) return getMyAppointments();
      if (isProvider) return getProviderAppointments(undefined, undefined);
      if (isStaffOrAdmin) return getClinicAppointments();
      return [] as (PatientAppointment | ProviderAppointment)[];
    },
    enabled:
      isPatient ||
      isProvider ||
      (isStaffOrAdmin && !!user?.clinicId),
  });

  const showClinicView = isStaffOrAdmin;

  const subtitle =
    isPatient
      ? 'View your appointments'
      : showClinicView
        ? 'All clinic appointments'
        : 'View your scheduled appointments';

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Appointments"
        description={subtitle}
      />

      <AppCard>
        <AppCardHeader>
          <AppCardTitle>Appointments</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          {isLoading ? (
            <div className="flex min-h-[120px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
            </div>
          ) : error ? (
            <p className="text-sm text-danger">Failed to load appointments.</p>
          ) : !appointments.length ? (
            <AppEmptyState
              title="No appointments yet"
              description={
                isPatient
                  ? 'Book your first appointment to get started.'
                  : 'No scheduled appointments.'
              }
              actionLabel={isPatient ? 'Book appointment' : undefined}
              onAction={isPatient ? () => window.location.assign('/') : undefined}
            />
          ) : (
            <div className="space-y-4">
              {(appointments as (PatientAppointment | ProviderAppointment)[]).map(
                (apt: PatientAppointment | ProviderAppointment) => (
                  <div
                    key={apt.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/80 p-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {apt.service.name}
                        {(isProvider || showClinicView) &&
                          'patient' in apt &&
                          apt.patient && (
                            <span className="ml-2 text-sm font-normal text-slate-600">
                              · {apt.patient.name}
                            </span>
                          )}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        {isPatient && 'provider' in apt && apt.provider && (
                          <span>
                            {apt.provider.firstName} {apt.provider.lastName} ·{' '}
                          </span>
                        )}
                        {showClinicView && 'provider' in apt && apt.provider && (
                          <span>
                            {apt.provider.firstName} {apt.provider.lastName} ·{' '}
                          </span>
                        )}
                        <span>{formatDateTime(apt.startTime)}</span>
                        {showClinicView && (
                          <StatusBadge status={apt.status} variant="appointment" />
                        )}
                      </div>
                    </div>
                    <AppButton variant="outline" size="sm" asChild>
                      <Link
                        href={
                          isPatient
                            ? `/dashboard/patient/appointments/${apt.id}`
                            : `/dashboard/provider/appointments/${apt.id}`
                        }
                      >
                        View
                      </Link>
                    </AppButton>
                  </div>
                )
              )}
            </div>
          )}
        </AppCardContent>
      </AppCard>
    </div>
  );
}
