'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { listProviders } from '@/lib/availabilityApi';
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppButton,
  AppBadge,
  AppPageHeader,
  AppEmptyState,
} from '@/components/ui-system';
import { AddProviderDialog } from '@/components/providers/AddProviderDialog';
import { Plus } from 'lucide-react';

export default function ProvidersPage() {
  const { user } = useAuth();
  const clinicId = user?.clinicId?.trim() || undefined;
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const canAddProvider = user?.role === 'SUPER_ADMIN';

  const { data: providers, isLoading, error } = useQuery({
    queryKey: ['providers'],
    queryFn: () => listProviders(),
    enabled: !!clinicId,
  });

  if (!clinicId) {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Providers" description="Manage clinic providers and their services." />
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
        title="Providers"
        description="Manage clinic providers and their services."
        actions={
          canAddProvider ? (
            <AppButton onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Provider
            </AppButton>
          ) : undefined
        }
      />

      <AppCard>
        <AppCardHeader>
          <AppCardTitle>Providers</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              Failed to load providers.
            </div>
          )}
          {providers?.length === 0 && !error && (
            <AppEmptyState
              title="No providers yet"
              description="Add your first provider to start scheduling appointments."
              actionLabel={canAddProvider ? 'Add Provider' : undefined}
              onAction={canAddProvider ? () => setAddDialogOpen(true) : undefined}
            />
          )}
          {providers && providers.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((p) => (
                <AppCard key={p.id} className="flex flex-col">
                  <AppCardContent className="flex flex-1 flex-col">
                    <div className="flex min-w-0 flex-col gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {p.firstName} {p.lastName}
                        </p>
                        {p.email && (
                          <p className="text-sm text-muted-foreground">{p.email}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(p.disciplines?.length
                          ? p.disciplines.map((pd) => pd.discipline.name)
                          : p.discipline
                            ? [p.discipline.name]
                            : []
                        ).map((name) => (
                          <AppBadge key={name} variant="secondary">
                            {name}
                          </AppBadge>
                        ))}
                      </div>
                      {p.providerServices && p.providerServices.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            Services offered
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {p.providerServices.map((ps) => (
                              <AppBadge
                                key={ps.id || ps.service.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {ps.service.name}
                                {ps.priceOverride
                                  ? ` · $${ps.priceOverride} override`
                                  : ''}
                              </AppBadge>
                            ))}
                          </div>
                        </div>
                      )}
                      {p.locationAssignments && p.locationAssignments.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            Launch location
                          </p>
                          <AppBadge variant="secondary">
                            {p.locationAssignments.find((assignment) => assignment.isPrimary)?.location.name ??
                              p.locationAssignments[0].location.name}
                          </AppBadge>
                        </div>
                      )}
                      <Link
                        href={`/dashboard/providers/${p.id}/availability`}
                        className="mt-auto pt-2"
                      >
                        <AppButton variant="outline" size="sm" className="w-full">
                          Edit Availability
                        </AppButton>
                      </Link>
                    </div>
                  </AppCardContent>
                </AppCard>
              ))}
            </div>
          )}
        </AppCardContent>
      </AppCard>

      <AddProviderDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
