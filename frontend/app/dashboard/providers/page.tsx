'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectedClinicId } from '@/contexts/ClinicContext';
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
import { Plus } from 'lucide-react';

const ALLOWED_ROLES = ['SUPER_ADMIN', 'CLINIC_ADMIN'] as const;

export default function ProvidersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const clinicId = useSelectedClinicId();
  const effectiveClinicId = (clinicId ?? user?.clinicId)?.trim() || undefined;
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
        <p className="text-gray-500">
          {user?.role === 'SUPER_ADMIN'
            ? 'Select a clinic from the dropdown above to view providers.'
            : 'You are not assigned to a clinic.'}
        </p>
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
          <Button onClick={() => setAddDialogOpen(true)}>
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-gray-500">No providers yet.</p>
              <p className="mt-1 text-sm text-gray-500">
                Add your first provider to start scheduling appointments.
              </p>
              {canAddProvider && (
                <Button
                  className="mt-4"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Provider
                </Button>
              )}
            </div>
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
                        <Badge variant="secondary">{p.discipline.name}</Badge>
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
