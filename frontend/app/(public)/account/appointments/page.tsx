'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { getMyAppointments, type PatientAppointment } from '@/lib/patientApi'
import { StatusBadge } from '@/components/common/StatusBadge'
import {
  AppPageHeader,
  AppTable,
  AppButton,
  LoadingSkeleton,
  AppErrorState,
} from '@/components/ui-system'

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AccountAppointmentsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    data: appointments,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['patient', 'appointments'],
    queryFn: () => getMyAppointments(),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Appointments" description="Upcoming and past visits" />
        <LoadingSkeleton variant="table" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Appointments" description="Upcoming and past visits" />
        <AppErrorState
          title="Could not load your appointments"
          description="Check your connection and try again."
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  const bookHref = user?.clinicId ? `/clinic/${user.clinicId}` : '/store'

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Appointments"
        description="Upcoming and past visits"
        actions={
          <AppButton size="sm" asChild>
            <Link href={bookHref}>Book appointment</Link>
          </AppButton>
        }
      />

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <AppTable
          columns={[
            {
              key: 'service',
              header: 'Service',
              render: (apt: PatientAppointment) => (
                <span className="font-semibold text-slate-900">{apt.service.name}</span>
              ),
            },
            {
              key: 'provider',
              header: 'Provider',
              render: (apt: PatientAppointment) => (
                <span className="text-slate-600">
                  {apt.provider.firstName} {apt.provider.lastName}
                </span>
              ),
            },
            {
              key: 'datetime',
              header: 'Date & Time',
              render: (apt: PatientAppointment) => (
                <span className="text-slate-600 font-medium">{formatDateTime(apt.startTime)}</span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (apt: PatientAppointment) => (
                <StatusBadge status={apt.status} variant="appointment" />
              ),
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: (apt: PatientAppointment) => (
                <AppButton variant="ghost" size="sm" asChild className="rounded-full">
                  <Link href={`/account/appointments/${apt.id}`}>View</Link>
                </AppButton>
              ),
            },
          ]}
          data={appointments ?? []}
          keyExtractor={(apt: PatientAppointment) => apt.id}
          emptyTitle="No appointments yet"
          emptyDescription="Book your first appointment to get started."
          emptyActionLabel="Book appointment"
          onEmptyAction={() => router.push(bookHref)}
        />
      </div>
    </div>
  )
}
