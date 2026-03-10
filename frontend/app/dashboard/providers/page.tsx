'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useClinic } from '@/contexts/ClinicContext';
import { useClinicGuard } from '@/hooks/useClinicGuard';
import { listProviders } from '@/lib/availabilityApi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddProviderDialog } from '@/components/providers/AddProviderDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Plus } from 'lucide-react';

const ALLOWED_ROLES = ['SUPER_ADMIN', 'CLINIC_ADMIN'] as const;

export default function ProvidersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { clinicId, ensureClinicSelected } = useClinicGuard();
  const effectiveClinicId = (clinicId ?? user?.clinicId)?.trim() || undefined;
  const { clinics } = useClinic();
  const hasNoClinics = user?.role === 'SUPER_ADMIN' && clinics.length === 0;
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const canAddProvider = user?.role && ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number]);

  const { data: providers, isLoading, error } = useQuery({
    queryKey: ['providers', effectiveClinicId],
    queryFn: () => listProviders(effectiveClinicId),
    enabled: !!effectiveClinicId,
  });

  if (!user?.role || !ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number])) {
    router.replace('/dashboard');
    return null;
  }

  if (!effectiveClinicId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Providers</h1>
        <EmptyState
          title={
            hasNoClinics
              ? 'Oops! No Clinics Found'
              : user?.role === 'SUPER_ADMIN'
                ? 'No clinic selected'
                : 'No clinic assigned'
          }
          description={
            hasNoClinics
              ? "You haven't created any clinics yet. Create a clinic to begin setting up providers and services."
              : user?.role === 'SUPER_ADMIN'
                ? 'Select a clinic from the top-right to manage providers and their availability.'
                : 'You are not assigned to a clinic.'
          }
          actionLabel={hasNoClinics ? 'Create Clinic' : undefined}
          onAction={hasNoClinics ? () => (window.location.href = '/dashboard/clinics/new') : undefined}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Providers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage providers and their availability
          </p>
        </div>
        {canAddProvider && (
          <Button onClick={() => ensureClinicSelected() && setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Provider
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Providers</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load providers.
            </div>
          )}
          {providers?.length === 0 && !error && (
            <EmptyState
              title="No providers yet"
              description="Add your first provider to start scheduling appointments."
              actionLabel={canAddProvider ? 'Add Provider' : undefined}
              onAction={canAddProvider ? () => ensureClinicSelected() && setAddDialogOpen(true) : undefined}
            />
          )}
          {providers && providers.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((p) => (
                <Card key={p.id} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col p-6">
                    <div className="flex min-w-0 flex-col gap-3">
                      <p className="font-medium text-gray-900">
                        {p.firstName} {p.lastName}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(p.disciplines?.length
                          ? p.disciplines.map((pd) => pd.discipline.name)
                          : p.discipline
                            ? [p.discipline.name]
                            : []
                        ).map((name) => (
                          <Badge key={name} variant="secondary">
                            {name}
                          </Badge>
                        ))}
                      </div>
                      {p.providerServices && p.providerServices.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500">
                            Services offered
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {p.providerServices.map((ps) => (
                              <Badge
                                key={ps.service.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {ps.service.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <Link
                        href={`/dashboard/providers/${p.id}/availability`}
                        className="mt-auto pt-2"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          Edit Availability
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddProviderDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
