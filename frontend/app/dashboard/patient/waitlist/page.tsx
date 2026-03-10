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
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppPageHeader,
  AppButton,
  AppBadge,
} from '@/components/ui-system';

const statusConfig: Record<
  WaitlistStatus,
  { label: string; variant: 'warning' | 'accent' | 'success' | 'outline' }
> = {
  WAITING: { label: 'Waiting', variant: 'warning' },
  OFFERED: { label: 'Offered', variant: 'accent' },
  BOOKED: { label: 'Booked', variant: 'success' },
  EXPIRED: { label: 'Expired', variant: 'outline' },
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AppPageHeader title="My waitlist" description="View and manage your waitlist entries" />
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load waitlist. Please try again.
        </div>
        <Link
          href="/dashboard/patient/appointments"
          className="inline-block text-sm text-accent hover:text-accent/90"
        >
          ← Back to appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="My waitlist"
        description="View and manage your waitlist entries. Claim offered slots before they expire."
      />

      {!entries?.length ? (
        <AppCard>
          <AppCardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No waitlist entries yet.</p>
            <Link href="/" className="mt-4 inline-block">
              <AppButton variant="outline" size="sm">
                Browse clinics to join a waitlist
              </AppButton>
            </Link>
          </AppCardContent>
        </AppCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {entries.map((entry: WaitlistEntry) => {
            const config = statusConfig[entry.status] ?? {
              label: entry.status,
              variant: 'outline' as const,
            };
            const isOffered = entry.status === 'OFFERED';
            const isClaiming = claimMutation.isPending && claimMutation.variables === entry.id;

            return (
              <AppCard key={entry.id} className="flex flex-col">
                <AppCardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">
                        {entry.service.name}
                      </h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {entry.provider.firstName} {entry.provider.lastName}
                        {(entry.provider.disciplines?.length
                            ? entry.provider.disciplines.map((pd) => pd.discipline.name).join(' · ')
                            : entry.provider.discipline?.name) && (
                          <span className="text-muted-foreground">
                            {' '}
                            ·{' '}
                            {entry.provider.disciplines?.length
                              ? entry.provider.disciplines.map((pd) => pd.discipline.name).join(' · ')
                              : entry.provider.discipline?.name}
                          </span>
                        )}
                      </p>
                    </div>
                    <AppBadge variant={config.variant}>{config.label}</AppBadge>
                  </div>
                </AppCardHeader>
                <AppCardContent className="mt-auto space-y-3 pt-2">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <dt className="text-muted-foreground">Clinic</dt>
                    <dd className="font-medium text-foreground">{entry.clinic.name}</dd>
                    <dt className="text-muted-foreground">Preferred date</dt>
                    <dd className="font-medium text-foreground">
                      {formatDate(entry.preferredDate)}
                    </dd>
                    <dt className="text-muted-foreground">Preferred time</dt>
                    <dd className="font-medium text-foreground">
                      {formatTimeRange(
                        entry.preferredStartTime,
                        entry.preferredEndTime
                      )}
                    </dd>
                  </dl>
                  {isOffered && (
                    <div className="pt-2">
                      <AppButton
                        onClick={() => claimMutation.mutate(entry.id)}
                        disabled={isClaiming}
                      >
                        {isClaiming ? 'Claiming...' : 'Claim slot'}
                      </AppButton>
                      {claimMutation.isError && claimMutation.variables === entry.id && (
                        <p className="mt-2 text-sm text-destructive">
                          {(claimMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                            (claimMutation.error instanceof Error
                              ? claimMutation.error.message
                              : 'Failed to claim. Please try again.')}
                        </p>
                      )}
                    </div>
                  )}
                </AppCardContent>
              </AppCard>
            );
          })}
        </div>
      )}

      <Link
        href="/dashboard/patient/appointments"
        className="inline-block text-sm text-accent hover:text-accent/90"
      >
        ← Back to appointments
      </Link>
    </div>
  );
}
