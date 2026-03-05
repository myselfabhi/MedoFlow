'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectedClinicId } from '@/contexts/ClinicContext';
import {
  getMyAppointments,
  getProviderAppointments,
  getClinicAppointments,
  type PatientAppointment,
  type ProviderAppointment,
} from '@/lib/patientApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const clinicId = useSelectedClinicId();
  const effectiveClinicId = clinicId ?? user?.clinicId ?? '';
  const isProvider = user?.role === 'PROVIDER';
  const isPatient = user?.role === 'PATIENT';
  const isStaffOrAdmin =
    user?.role === 'STAFF' ||
    user?.role === 'CLINIC_ADMIN' ||
    user?.role === 'SUPER_ADMIN';

  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ['appointments', user?.role, effectiveClinicId],
    queryFn: async () => {
      if (isPatient) return getMyAppointments(user?.clinicId ?? undefined);
      if (isProvider) return getProviderAppointments(effectiveClinicId || undefined);
      if (isStaffOrAdmin) return getClinicAppointments(effectiveClinicId);
      return [] as (PatientAppointment | ProviderAppointment)[];
    },
    enabled:
      isPatient ||
      isProvider ||
      (isStaffOrAdmin && !!effectiveClinicId),
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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex min-h-[120px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">Failed to load appointments.</p>
          ) : !appointments.length ? (
            <EmptyState
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
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 p-4"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {apt.service.name}
                        {(isProvider || showClinicView) &&
                          'patient' in apt &&
                          apt.patient && (
                            <span className="ml-2 text-sm font-normal text-gray-500">
                              · {apt.patient.name}
                            </span>
                          )}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
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
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={
                          isPatient
                            ? `/dashboard/patient/appointments/${apt.id}`
                            : `/dashboard/provider/appointments/${apt.id}`
                        }
                      >
                        View
                      </Link>
                    </Button>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
