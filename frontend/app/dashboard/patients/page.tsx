'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getClinicAppointments } from '@/lib/patientApi';
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppPageHeader,
  AppEmptyState,
  AppButton,
} from '@/components/ui-system';
import { StatusBadge } from '@/components/common/StatusBadge';
import { User, Calendar } from 'lucide-react';

interface PatientSummary {
  id: string;
  name: string;
  email: string;
  appointmentCount: number;
  lastAppointment?: string;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const ALLOWED_ROLES = ['SUPER_ADMIN', 'FRONT_DESK'] as const;

export default function PatientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? '';
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    if (
      user?.role &&
      !ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number])
    ) {
      router.replace('/dashboard');
    }
  }, [user?.role, router]);

  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ['clinic-appointments', 'patients'],
    queryFn: () => getClinicAppointments(),
    enabled: !!clinicId,
  });

  const patients: PatientSummary[] = useMemo(() => {
    const map = new Map<string, PatientSummary>();
    for (const apt of appointments) {
      if (!apt.patient) continue;
      const existing = map.get(apt.patient.id);
      const aptDate = new Date(apt.startTime);
      if (!existing) {
        map.set(apt.patient.id, {
          id: apt.patient.id,
          name: apt.patient.name,
          email: apt.patient.email,
          appointmentCount: 1,
          lastAppointment: apt.startTime,
        });
      } else {
        existing.appointmentCount += 1;
        if (
          !existing.lastAppointment ||
          aptDate > new Date(existing.lastAppointment)
        ) {
          existing.lastAppointment = apt.startTime;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      (b.name ?? '').localeCompare(a.name ?? '')
    );
  }, [appointments]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const selectedAppointments = useMemo(
    () =>
      appointments.filter(
        (a) => a.patient?.id === selectedPatientId
      ),
    [appointments, selectedPatientId]
  );

  if (
    !user?.role ||
    !ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number])
  ) {
    return null;
  }

  if (!clinicId) {
    return (
      <div className="space-y-6">
        <AppPageHeader
          title="Patients"
          description="View and manage clinic patients"
        />
        <AppEmptyState
          title="No clinic assigned"
          description="You are not assigned to a clinic. Contact your administrator."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Patients"
        description="View patient records and appointment history"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left panel: Patient list */}
        <div className="lg:col-span-1">
          <AppCard>
            <AppCardHeader>
              <AppCardTitle>Patient list</AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="p-0">
              {error ? (
                <div className="p-6">
                  <p className="text-sm text-destructive">
                    Failed to load patients.
                  </p>
                </div>
              ) : patients.length === 0 ? (
                <div className="p-6">
                  <AppEmptyState
                    title="No patients yet"
                    description="Patients will appear here once they have appointments."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {patients.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedPatientId(p.id)}
                        className={`flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-subtle ${
                          selectedPatientId === p.id
                            ? 'bg-accent/10 text-accent'
                            : 'text-foreground'
                        }`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-subtle">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {p.appointmentCount} appointment
                            {p.appointmentCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </AppCardContent>
          </AppCard>
        </div>

        {/* Right panel: Patient record */}
        <div className="lg:col-span-2">
          <AppCard>
            <AppCardHeader>
              <AppCardTitle>Patient record</AppCardTitle>
            </AppCardHeader>
            <AppCardContent>
              {!selectedPatient ? (
                <AppEmptyState
                  title="Select a patient"
                  description="Choose a patient from the list to view their record."
                />
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        {selectedPatient.name}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedPatient.email}
                      </p>
                    </div>
                    <AppButton variant="outline" size="sm" asChild>
                      <Link
                        href={`/dashboard/provider/patients/${selectedPatient.id}/timeline`}
                      >
                        View full record
                      </Link>
                    </AppButton>
                  </div>

                  <div>
                    <h3 className="mb-3 text-lg font-medium text-foreground">
                      Appointments
                    </h3>
                    {selectedAppointments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No appointments found.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {selectedAppointments
                          .sort(
                            (a, b) =>
                              new Date(b.startTime).getTime() -
                              new Date(a.startTime).getTime()
                          )
                          .slice(0, 10)
                          .map((apt) => (
                            <li
                              key={apt.id}
                              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-subtle"
                            >
                              <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">
                                    {apt.service?.name ?? '—'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDateTime(apt.startTime)}
                                    {apt.provider &&
                                      ` · ${apt.provider.firstName} ${apt.provider.lastName}`}
                                  </p>
                                </div>
                              </div>
                              <StatusBadge
                                status={apt.status}
                                variant="appointment"
                              />
                              <AppButton variant="ghost" size="sm" asChild>
                                <Link
                                  href={`/dashboard/provider/appointments/${apt.id}`}
                                >
                                  View
                                </Link>
                              </AppButton>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </AppCardContent>
          </AppCard>
        </div>
      </div>
    </div>
  );
}
