'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectedClinicId } from '@/contexts/ClinicContext';
import { listProviders } from '@/lib/availabilityApi';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function ProvidersPage() {
  const { user } = useAuth();
  const clinicId = useSelectedClinicId();
  const effectiveClinicId = (clinicId ?? user?.clinicId)?.trim() || undefined;

  const { data: providers, isLoading, error } = useQuery({
    queryKey: ['providers', effectiveClinicId],
    queryFn: () => listProviders(effectiveClinicId),
    enabled: !!effectiveClinicId,
  });

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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Providers</h1>
        <p className="mt-1 text-sm text-gray-500">Manage providers and their availability</p>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Providers</h2>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load providers.
            </div>
          )}
          {providers?.length === 0 && !error && (
            <p className="text-gray-500">No providers yet.</p>
          )}
          {providers && providers.length > 0 && (
            <ul className="divide-y divide-gray-200">
              {providers.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <span className="text-sm font-medium text-gray-900">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className="text-sm text-gray-500">{p.discipline.name}</span>
                  <Link
                    href={`/dashboard/providers/${p.id}/availability`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Edit availability
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
