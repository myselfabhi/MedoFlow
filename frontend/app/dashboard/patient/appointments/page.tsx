'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getMyAppointments, type PatientAppointment } from '@/lib/patientApi';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  AppPageHeader,
  AppTable,
  AppButton,
} from '@/components/ui-system';
import { PageContainer } from '@/components/layout';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['patient', 'appointments'],
    queryFn: () => getMyAppointments(),
  });

  if (isLoading) {
    return (
      <PageContainer className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer className="space-y-6">
        <AppPageHeader title="My Appointments" description="View and manage your health consultations" />
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load appointments. Please try again.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-8">
      <AppPageHeader
        title="My Appointments"
        description="View and manage your health consultations"
        actions={
          <AppButton size="sm" asChild>
            <Link href="/">Book New Appointment</Link>
          </AppButton>
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <AppTable
          columns={[
            {
              key: 'service',
              header: 'Service',
              render: (apt: PatientAppointment) => <span className="font-bold text-foreground">{apt.service.name}</span>,
            },
            {
              key: 'provider',
              header: 'Provider',
              render: (apt: PatientAppointment) => (
                <span className="text-muted-foreground">
                  {apt.provider.firstName} {apt.provider.lastName}
                </span>
              ),
            },
            {
              key: 'datetime',
              header: 'Date & Time',
              render: (apt: PatientAppointment) => (
                <span className="text-muted-foreground font-medium">{formatDateTime(apt.startTime)}</span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (apt: PatientAppointment) => <StatusBadge status={apt.status} variant="appointment" />,
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: (apt: PatientAppointment) => (
                <AppButton variant="ghost" size="sm" asChild className="rounded-full">
                  <Link href={`/dashboard/patient/appointments/${apt.id}`}>View Details</Link>
                </AppButton>
              ),
            },
          ]}
          data={appointments ?? []}
          keyExtractor={(apt: PatientAppointment) => apt.id}
          emptyTitle="No appointments yet"
          emptyDescription="Book your first appointment to get started."
          emptyActionLabel="Book an appointment"
          onEmptyAction={() => router.push('/')}
        />
      </div>
    </PageContainer>
  );
}
