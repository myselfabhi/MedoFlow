'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    getAppointmentsByPatient,
    getVisitsByPatient,
    getPrescriptionsByPatient,
    getPlansByPatient,
    getFormResponsesByPatient,
    type TimelineEvent,
    type TimelineEventType,
} from '@/lib/patientTimelineApi';
import type { PatientAppointment } from '@/lib/patientApi';
import type { VisitRecord } from '@/lib/patientApi';
import type { Prescription } from '@/lib/patientApi';
import type { TreatmentPlan } from '@/lib/treatmentPlanApi';
import { Card, CardContent } from '@/components/ui/Card';

// ───────────────────── Helpers ─────────────────────

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function buildTimelineEvents(
    appointments: PatientAppointment[],
    visits: VisitRecord[],
    prescriptions: Prescription[],
    plans: TreatmentPlan[],
    formResponses: { id: string; template: { name: string }; appointmentId?: string | null; createdAt: string }[]
): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    appointments
        .filter((a) => a.status === 'COMPLETED')
        .forEach((a) => {
            events.push({
                id: `apt-${a.id}`,
                type: 'APPOINTMENT',
                title: `${a.service.name} — ${a.location.name}`,
                description: `${a.provider.firstName} ${a.provider.lastName}`,
                date: a.startTime,
                appointmentId: a.id,
            });
        });

    visits
        .filter((v) => v.status === 'FINAL')
        .forEach((v) => {
            const assessment = v.assessment ?? v.plan ?? 'Visit completed';
            events.push({
                id: `visit-${v.id}`,
                type: 'VISIT',
                title: 'Visit note finalized',
                description: assessment.slice(0, 100) + (assessment.length > 100 ? '…' : ''),
                date: v.updatedAt,
                appointmentId: v.appointmentId,
                visitId: v.id,
            });
        });

    prescriptions.forEach((p) => {
        events.push({
            id: `rx-${p.id}`,
            type: 'PRESCRIPTION',
            title: 'Prescription',
            description: p.notes.slice(0, 100) + (p.notes.length > 100 ? '…' : ''),
            date: p.createdAt,
            appointmentId: p.appointment?.id,
        });
    });

    formResponses.forEach((fr) => {
        events.push({
            id: `form-${fr.id}`,
            type: 'FORM_SUBMITTED',
            title: 'Intake Form Submitted',
            description: fr.template.name,
            date: fr.createdAt,
            appointmentId: fr.appointmentId ?? undefined,
        });
    });

    plans.forEach((p) => {
        events.push({
            id: `plan-created-${p.id}`,
            type: 'PLAN_CREATED',
            title: `Plan created: ${p.name}`,
            description: p.discipline.name,
            date: p.createdAt,
        });
        if (p.status === 'COMPLETED') {
            events.push({
                id: `plan-completed-${p.id}`,
                type: 'PLAN_COMPLETED',
                title: `Plan completed: ${p.name}`,
                description: `${p.sessionsCompleted}/${p.totalSessions} sessions`,
                date: p.updatedAt,
            });
        } else if (p.status === 'DISCONTINUED') {
            events.push({
                id: `plan-discontinued-${p.id}`,
                type: 'PLAN_DISCONTINUED',
                title: `Plan discontinued: ${p.name}`,
                description: p.notes ?? undefined,
                date: p.updatedAt,
            });
        }
    });

    return events.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

// ───────────────────── Colors ─────────────────────

const TYPE_COLORS: Record<TimelineEventType, string> = {
    APPOINTMENT: 'bg-blue-500',
    VISIT: 'bg-purple-500',
    PRESCRIPTION: 'bg-green-500',
    PLAN_CREATED: 'bg-cyan-500',
    PLAN_COMPLETED: 'bg-emerald-500',
    PLAN_DISCONTINUED: 'bg-gray-400',
    FORM_SUBMITTED: 'bg-cyan-500',
};

// ───────────────────── Skeleton ─────────────────────

function TimelineSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="h-4 w-4 animate-pulse rounded-full bg-gray-200" />
                        <div className="mt-2 h-16 w-0.5 bg-gray-200 last:hidden" />
                    </div>
                    <Card className="flex-1 animate-pulse">
                        <CardContent className="py-4">
                            <div className="h-4 w-3/5 rounded bg-gray-200" />
                            <div className="mt-2 h-3 w-2/5 rounded bg-gray-200" />
                            <div className="mt-2 h-3 w-full rounded bg-gray-200" />
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    );
}

// ───────────────────── Timeline Card ─────────────────────

function TimelineEventCard({ event }: { event: TimelineEvent }) {
    const href =
        event.appointmentId
            ? `/dashboard/provider/appointments/${event.appointmentId}`
            : null;

    const content = (
        <Card className="transition-shadow hover:shadow-md">
            <CardContent className="py-4">
                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                {event.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {event.description}
                    </p>
                )}
                <p className="mt-2 text-xs text-gray-400">{formatDate(event.date)}</p>
            </CardContent>
        </Card>
    );

    if (href) {
        return (
            <Link
                href={href}
                className="block transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
            >
                {content}
            </Link>
        );
    }

    return content;
}

// ───────────────────── Page ─────────────────────

export default function ProviderPatientTimelinePage() {
    const params = useParams();
    const patientId = params.patientId as string;
    const { user } = useAuth();
    const clinicId = user?.clinicId ?? undefined;

    const [appointmentsQuery, visitsQuery, prescriptionsQuery, plansQuery, formResponsesQuery] =
        useQueries({
            queries: [
                {
                    queryKey: ['appointments', 'patient', patientId],
                    queryFn: () => getAppointmentsByPatient(patientId, clinicId),
                    enabled: !!patientId,
                },
                {
                    queryKey: ['visits', 'patient', patientId],
                    queryFn: () => getVisitsByPatient(patientId, clinicId),
                    enabled: !!patientId && !!clinicId,
                },
                {
                    queryKey: ['prescriptions', 'patient', patientId],
                    queryFn: () => getPrescriptionsByPatient(patientId, clinicId),
                    enabled: !!patientId && !!clinicId,
                },
                {
                    queryKey: ['treatmentPlans', patientId],
                    queryFn: () => getPlansByPatient(patientId),
                    enabled: !!patientId,
                },
                {
                    queryKey: ['formResponses', 'patient', patientId],
                    queryFn: () => getFormResponsesByPatient(patientId, clinicId),
                    enabled: !!patientId && !!clinicId,
                },
            ],
        });

    const isLoading =
        appointmentsQuery.isLoading ||
        visitsQuery.isLoading ||
        prescriptionsQuery.isLoading ||
        plansQuery.isLoading ||
        formResponsesQuery.isLoading;

    const isError =
        appointmentsQuery.isError ||
        visitsQuery.isError ||
        prescriptionsQuery.isError ||
        plansQuery.isError ||
        formResponsesQuery.isError;

    const error =
        appointmentsQuery.error ??
        visitsQuery.error ??
        prescriptionsQuery.error ??
        plansQuery.error ??
        formResponsesQuery.error;

    const events = React.useMemo(() => {
        if (isLoading || isError) return [];
        return buildTimelineEvents(
            appointmentsQuery.data ?? [],
            visitsQuery.data ?? [],
            prescriptionsQuery.data ?? [],
            plansQuery.data ?? [],
            formResponsesQuery.data ?? []
        );
    }, [
        isLoading,
        isError,
        appointmentsQuery.data,
        visitsQuery.data,
        prescriptionsQuery.data,
        plansQuery.data,
        formResponsesQuery.data,
    ]);

    const refetch = () => {
        appointmentsQuery.refetch();
        visitsQuery.refetch();
        prescriptionsQuery.refetch();
        plansQuery.refetch();
        formResponsesQuery.refetch();
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Patient Timeline</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Appointments, visits, prescriptions, and treatment plans
                </p>
            </div>

            {isLoading ? (
                <TimelineSkeleton />
            ) : isError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-sm text-red-700">
                        {(error as { message?: string })?.message ??
                            'Failed to load timeline.'}
                    </p>
                    <button
                        type="button"
                        onClick={refetch}
                        className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            ) : events.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
                    <svg
                        className="mx-auto h-10 w-10 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <p className="mt-3 text-sm font-medium text-gray-600">
                        No timeline events yet
                    </p>
                </div>
            ) : (
                <div className="relative">
                    {/* Vertical line */}
                    <div
                        className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-gray-200"
                        aria-hidden
                    />
                    <div className="space-y-0">
                        {events.map((event, i) => (
                            <div
                                key={event.id}
                                className="relative flex gap-4"
                                style={{ marginBottom: i < events.length - 1 ? 0 : 0 }}
                            >
                                <div className="relative z-10 flex flex-col items-center pt-1">
                                    <div
                                        className={`h-4 w-4 shrink-0 rounded-full ring-2 ring-white ${TYPE_COLORS[event.type]}`}
                                    />
                                </div>
                                <div className="flex-1 pb-8">
                                    <TimelineEventCard event={event} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
