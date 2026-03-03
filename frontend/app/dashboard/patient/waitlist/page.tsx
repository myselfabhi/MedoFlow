'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyWaitlist,
  claimWaitlistOffer,
  type WaitlistEntry,
  type WaitlistStatus,
} from '@/lib/waitlistApi';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

const statusConfig: Record<
  WaitlistStatus,
  { label: string; className: string }
> = {
  WAITING: { label: 'Waiting', className: 'bg-amber-100 text-amber-800' },
  OFFERED: { label: 'Offered', className: 'bg-blue-100 text-blue-800' },
  BOOKED: { label: 'Booked', className: 'bg-green-100 text-green-800' },
  EXPIRED: { label: 'Expired', className: 'bg-gray-100 text-gray-800' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeRange(start: string, end: string) {
  return `${start} – ${end}`;
}

export default function PatientWaitlistPage() {
  const queryClient = useQueryClient();

  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['waitlist'],
    queryFn: () => getMyWaitlist(),
  });

  const claimMutation = useMutation({
    mutationFn: (entryId: string) => claimWaitlistOffer(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My waitlist</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your waitlist entries
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load waitlist. Please try again.
        </div>
        <Link
          href="/dashboard/patient/appointments"
          className="inline-block text-sm text-primary-600 hover:text-primary-700"
        >
          ← Back to appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My waitlist</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your waitlist entries. Claim offered slots before they expire.
        </p>
      </div>

      {!entries?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No waitlist entries yet.</p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Browse clinics to join a waitlist
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {entries.map((entry: WaitlistEntry) => {
            const config = statusConfig[entry.status] ?? {
              label: entry.status,
              className: 'bg-gray-100 text-gray-800',
            };
            const isOffered = entry.status === 'OFFERED';
            const isClaiming = claimMutation.isPending && claimMutation.variables === entry.id;

            return (
              <Card key={entry.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">
                        {entry.service.name}
                      </h2>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {entry.provider.firstName} {entry.provider.lastName}
                        {entry.provider.discipline?.name && (
                          <span className="text-gray-500">
                            {' '}
                            · {entry.provider.discipline.name}
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
                    >
                      {config.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto space-y-3 pt-2">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <dt className="text-gray-500">Clinic</dt>
                    <dd className="font-medium text-gray-900">{entry.clinic.name}</dd>
                    <dt className="text-gray-500">Preferred date</dt>
                    <dd className="font-medium text-gray-900">
                      {formatDate(entry.preferredDate)}
                    </dd>
                    <dt className="text-gray-500">Preferred time</dt>
                    <dd className="font-medium text-gray-900">
                      {formatTimeRange(
                        entry.preferredStartTime,
                        entry.preferredEndTime
                      )}
                    </dd>
                  </dl>
                  {isOffered && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => claimMutation.mutate(entry.id)}
                        disabled={isClaiming}
                        className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 sm:w-auto"
                      >
                        {isClaiming ? (
                          <>
                            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Claiming...
                          </>
                        ) : (
                          'Claim slot'
                        )}
                      </button>
                      {claimMutation.isError && claimMutation.variables === entry.id && (
                        <p className="mt-2 text-sm text-red-600">
                          {(claimMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                            (claimMutation.error instanceof Error
                              ? claimMutation.error.message
                              : 'Failed to claim. Please try again.')}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Link
        href="/dashboard/patient/appointments"
        className="inline-block text-sm text-primary-600 hover:text-primary-700"
      >
        ← Back to appointments
      </Link>
    </div>
  );
}
