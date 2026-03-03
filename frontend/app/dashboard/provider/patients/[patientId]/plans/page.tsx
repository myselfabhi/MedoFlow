'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    getPlansByPatient,
    completeTreatmentPlan,
    discontinueTreatmentPlan,
    type TreatmentPlan,
    type TreatmentPlanStatus,
} from '@/lib/treatmentPlanApi';
import { getDisciplines } from '@/lib/disciplineApi';
import { Card, CardContent } from '@/components/ui/Card';
import { CreatePlanModal } from '@/components/CreatePlanModal';

// ───────────────────── helpers ─────────────────────

function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

const STATUS_STYLES: Record<TreatmentPlanStatus, string> = {
    ACTIVE: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    DISCONTINUED: 'bg-gray-200 text-gray-600',
};

// ────────────── Progress bar component ──────────────

function ProgressBar({
    completed,
    total,
}: {
    completed: number;
    total: number;
}) {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return (
        <div className="w-full">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                <span>
                    {completed} / {total} sessions
                </span>
                <span>{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                    className="h-full rounded-full bg-primary-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// ────────────── Skeleton loader ──────────────

function CardSkeleton() {
    return (
        <Card className="animate-pulse">
            <CardContent className="space-y-4">
                <div className="h-5 w-3/5 rounded bg-gray-200" />
                <div className="h-4 w-2/5 rounded bg-gray-200" />
                <div className="h-2 w-full rounded bg-gray-200" />
                <div className="flex gap-4">
                    <div className="h-4 w-3/5 rounded bg-gray-200" />
                    <div className="h-4 w-2/5 rounded bg-gray-200" />
                </div>
            </CardContent>
        </Card>
    );
}

// ────────────── Plan card ──────────────

function PlanCard({
    plan,
    onEdit,
    onComplete,
    onDiscontinue,
    isActioning,
}: {
    plan: TreatmentPlan;
    onEdit: () => void;
    onComplete: () => void;
    onDiscontinue: () => void;
    isActioning: boolean;
}) {
    const isActive = plan.status === 'ACTIVE';

    return (
        <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
            {/* colour accent bar */}
            <div
                className={`absolute left-0 top-0 h-full w-1 ${plan.status === 'ACTIVE'
                        ? 'bg-blue-500'
                        : plan.status === 'COMPLETED'
                            ? 'bg-green-500'
                            : 'bg-gray-400'
                    }`}
            />

            <CardContent className="pl-5 space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-gray-900">
                            {plan.name}
                        </h3>
                        <p className="text-sm text-gray-500">{plan.discipline.name}</p>
                    </div>
                    <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[plan.status]}`}
                    >
                        {plan.status}
                    </span>
                </div>

                {/* Progress */}
                <ProgressBar
                    completed={plan.sessionsCompleted}
                    total={plan.totalSessions}
                />

                {/* Dates */}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                    <span>
                        <span className="font-medium text-gray-600">Start:</span>{' '}
                        {formatDate(plan.startDate)}
                    </span>
                    <span>
                        <span className="font-medium text-gray-600">End:</span>{' '}
                        {formatDate(plan.endDate)}
                    </span>
                </div>

                {/* Provider */}
                <p className="text-xs text-gray-400">
                    Provider: {plan.provider.firstName} {plan.provider.lastName}
                </p>

                {/* Actions — only for ACTIVE plans */}
                {isActive && (
                    <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                        <button
                            type="button"
                            onClick={onEdit}
                            disabled={isActioning}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Update
                        </button>
                        <button
                            type="button"
                            onClick={onComplete}
                            disabled={isActioning}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            Complete
                        </button>
                        <button
                            type="button"
                            onClick={onDiscontinue}
                            disabled={isActioning}
                            className="rounded-lg bg-gray-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
                        >
                            Discontinue
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ───────────────────── Page ─────────────────────

type TabKey = 'active' | 'closed';

export default function ProviderPatientPlansPage() {
    const params = useParams();
    const patientId = params.patientId as string;
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const clinicId = user?.clinicId ?? '';

    // ── state ──
    const [activeTab, setActiveTab] = useState<TabKey>('active');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null);

    // ── queries ──
    const {
        data: plans = [],
        isLoading,
        isError,
        error,
    } = useQuery<TreatmentPlan[]>({
        queryKey: ['treatmentPlans', patientId],
        queryFn: () => getPlansByPatient(patientId),
        enabled: !!patientId,
    });

    // ── mutations ──
    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ['treatmentPlans', patientId] });

    const completeMut = useMutation({
        mutationFn: completeTreatmentPlan,
        onSuccess: invalidate,
    });

    const discontinueMut = useMutation({
        mutationFn: discontinueTreatmentPlan,
        onSuccess: invalidate,
    });

    const isActioning = completeMut.isPending || discontinueMut.isPending;

    // ── derived ──
    const activePlans = plans.filter((p) => p.status === 'ACTIVE');
    const closedPlans = plans.filter(
        (p) => p.status === 'COMPLETED' || p.status === 'DISCONTINUED'
    );
    const displayedPlans = activeTab === 'active' ? activePlans : closedPlans;

    // providerId: from existing plan, or "" (backend resolves from auth for PROVIDER)
    const providerId = plans[0]?.providerId ?? '';

    // ── handlers ──
    const openCreate = () => {
        setEditingPlan(null);
        setModalOpen(true);
    };
    const openEdit = (plan: TreatmentPlan) => {
        setEditingPlan(plan);
        setModalOpen(true);
    };

    // ────────────── Render ──────────────

    return (
        <>
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Treatment Plans</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage treatment plans for this patient
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Plan
                </button>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
                {(
                    [
                        { key: 'active' as TabKey, label: 'Active', count: activePlans.length },
                        { key: 'closed' as TabKey, label: 'Completed / Discontinued', count: closedPlans.length },
                    ] as const
                ).map(({ key, label, count }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setActiveTab(key)}
                        className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${activeTab === key
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {label}{' '}
                        <span
                            className={`ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${activeTab === key
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                        >
                            {count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            ) : isError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-sm text-red-700">
                        {(error as { message?: string })?.message ?? 'Failed to load treatment plans.'}
                    </p>
                    <button
                        type="button"
                        onClick={() =>
                            queryClient.invalidateQueries({
                                queryKey: ['treatmentPlans', patientId],
                            })
                        }
                        className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            ) : displayedPlans.length === 0 ? (
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
                            d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                    </svg>
                    <p className="mt-3 text-sm font-medium text-gray-600">
                        {activeTab === 'active'
                            ? 'No active treatment plans'
                            : 'No completed or discontinued plans'}
                    </p>
                    {activeTab === 'active' && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                        >
                            Create first plan
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {displayedPlans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            onEdit={() => openEdit(plan)}
                            onComplete={() => completeMut.mutate(plan.id)}
                            onDiscontinue={() => discontinueMut.mutate(plan.id)}
                            isActioning={isActioning}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            <CreatePlanModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingPlan(null);
                }}
                patientId={patientId}
                providerId={providerId}
                clinicId={clinicId}
                editingPlan={editingPlan}
                onSuccess={invalidate}
            />
        </>
    );
}
