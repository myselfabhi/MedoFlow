'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getLocations,
  createLocation,
  type Location,
  type CreateLocationPayload,
} from '@/lib/locationApi';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicGuard } from '@/hooks/useClinicGuard';
import { useAppToast } from '@/hooks/useAppToast';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
});

type LocationFormData = z.infer<typeof locationSchema>;

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC',
];

function LocationForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (data: LocationFormData) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      address: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          type="text"
          placeholder="e.g. Main Office"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          {...register('name')}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          id="address"
          type="text"
          placeholder="e.g. 123 Main St, City"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          {...register('address')}
        />
      </div>
      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
          Timezone
        </label>
        <select
          id="timezone"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          {...register('timezone')}
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
        {errors.timezone && <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Location'}
        </button>
      </div>
    </form>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 border-b border-gray-200 pb-3">
          <div className="h-4 flex-1 rounded bg-gray-200" />
          <div className="h-4 flex-1 rounded bg-gray-200" />
          <div className="h-4 w-32 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export default function LocationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { clinicId } = useClinicGuard();
  const toast = useAppToast();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const effectiveClinicId =
    user?.role === 'SUPER_ADMIN' ? (clinicId ?? user?.clinicId ?? undefined) : user?.clinicId ?? undefined;

  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['locations', effectiveClinicId],
    queryFn: () => getLocations(effectiveClinicId ?? undefined),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLocationPayload) =>
      createLocation(data, effectiveClinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setAddModalOpen(false);
      toast.success('Location created successfully');
    },
  });

  const handleAddSubmit = (data: LocationFormData) => {
    createMutation.mutate({
      name: data.name,
      address: data.address || undefined,
      timezone: data.timezone,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Locations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage clinic locations. At least one location is required for patient booking.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Add Location
        </button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">All Locations</h2>
        </CardHeader>
        <CardContent>
          {isLoading && <TableSkeleton />}

          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              Failed to load locations. Please try again.
            </div>
          )}

          {!isLoading && !error && (!locations || locations.length === 0) && (
            <div className="py-12 text-center">
              <p className="text-gray-500">No locations yet.</p>
              <p className="mt-1 text-sm text-gray-400">
                Add a location to enable patient booking for this clinic.
              </p>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Add Location
              </button>
            </div>
          )}

          {!isLoading && !error && locations && locations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Timezone
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {locations.map((loc: Location) => (
                    <tr key={loc.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {loc.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {loc.address || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {loc.timezone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Location"
      >
        <LocationForm
          onSubmit={handleAddSubmit}
          isSubmitting={createMutation.isPending}
        />
      </Modal>
    </div>
  );
}
