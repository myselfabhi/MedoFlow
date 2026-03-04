'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  getAppointmentById,
  getVisitByAppointment,
  getMyPrescriptions,
  type VisitRecordStatus,
} from '@/lib/patientApi';
import { getPatientForms } from '@/lib/formsApi';
import { PatientFilesSection } from '@/components/PatientFilesSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';
import { IntakeFormsSection } from '@/components/intake/IntakeFormsSection';

const visitStatusColors: Record<VisitRecordStatus, string> = {
  DRAFT: 'bg-amber-100 text-amber-800',
  FINAL: 'bg-green-100 text-green-800',
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function PatientAppointmentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const {
    data: appointment,
    isLoading: appointmentLoading,
    error: appointmentError,
  } = useQuery({
    queryKey: ['patient', 'appointment', id],
    queryFn: () => getAppointmentById(id),
    enabled: !!id,
  });

  const { data: visitRecord } = useQuery({
    queryKey: ['patient', 'visit', id],
    queryFn: () =>
      appointment ? getVisitByAppointment(id, appointment.clinicId) : null,
    enabled: !!appointment?.id,
  });

  const { data: allPrescriptions } = useQuery({
    queryKey: ['patient', 'prescriptions', appointment?.clinicId],
    queryFn: () => getMyPrescriptions(appointment?.clinicId),
    enabled: !!appointment,
  });

  const prescriptions = allPrescriptions?.filter(
    (p) => p.appointmentId === id
  ) ?? [];

  const { data: formResponses = [], isLoading: formsLoading } = useQuery({
    queryKey: ['forms', 'patient', appointment?.patientId, appointment?.clinicId],
    queryFn: () => getPatientForms(appointment!.patientId, appointment?.clinicId),
    enabled: !!appointment?.patientId && !!appointment?.clinicId,
  });

  if (appointmentLoading || !appointment) {
    if (appointmentError) {
      return (
        <div className="space-y-6">
          <Link
            href="/dashboard/patient/appointments"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            ← Back to appointments
          </Link>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            Appointment not found or access denied.
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard/patient/appointments"
        className="inline-block text-sm text-primary-600 hover:text-primary-700"
      >
        ← Back to appointments
      </Link>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Service</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {appointment.service.name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Provider</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {appointment.provider.firstName} {appointment.provider.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDateTime(appointment.startTime)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {appointment.status.replace(/_/g, ' ')}
                </span>
              </dd>
            </div>
          </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visit Record</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
          {visitRecord ? (
            <div className="mt-4 space-y-6">
              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    visitStatusColors[visitRecord.status]
                  }`}
                >
                  {visitRecord.status === 'DRAFT'
                    ? 'Awaiting provider finalization'
                    : 'Finalized'}
                </span>
              </div>
              <div className="space-y-4">
                {visitRecord.subjective && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Subjective
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap rounded border border-gray-100 bg-gray-50 p-3 text-sm text-gray-900">
                      {visitRecord.subjective}
                    </p>
                  </div>
                )}
                {visitRecord.objective && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Objective
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap rounded border border-gray-100 bg-gray-50 p-3 text-sm text-gray-900">
                      {visitRecord.objective}
                    </p>
                  </div>
                )}
                {visitRecord.assessment && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Assessment
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap rounded border border-gray-100 bg-gray-50 p-3 text-sm text-gray-900">
                      {visitRecord.assessment}
                    </p>
                  </div>
                )}
                {visitRecord.plan && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Plan</h3>
                    <p className="mt-1 whitespace-pre-wrap rounded border border-gray-100 bg-gray-50 p-3 text-sm text-gray-900">
                      {visitRecord.plan}
                    </p>
                  </div>
                )}
                {!visitRecord.subjective &&
                  !visitRecord.objective &&
                  !visitRecord.assessment &&
                  !visitRecord.plan && (
                    <p className="text-sm text-gray-500">
                      No visit notes recorded yet.
                    </p>
                  )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              No visit record for this appointment yet.
            </p>
          )}
          </CardContent>
        </Card>

        <IntakeFormsSection
          responses={formResponses}
          appointmentId={id}
          isLoading={formsLoading}
        />

        <PatientFilesSection
          patientId={appointment.patientId}
          clinicId={appointment.clinicId}
          canDelete={false}
        />

        <Card>
          <CardHeader>
            <CardTitle>Prescriptions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
          {prescriptions.length > 0 ? (
            <div className="mt-4 space-y-4">
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="rounded border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <span>
                      {formatDateTime(rx.createdAt)} •{' '}
                      {rx.provider.firstName} {rx.provider.lastName}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                    {rx.notes}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              No prescriptions for this appointment.
            </p>
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
