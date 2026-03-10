'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAppToast } from '@/hooks/useAppToast';
import { AppPageHeader, AppEmptyState } from '@/components/ui-system';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCurrentClinic, upsertLaunchLocation } from '@/lib/clinicAdminApi';
import { US_TIMEZONES, US_TIMEZONE_VALUES, DEFAULT_US_TIMEZONE } from '@/lib/constants/timezones';

const launchLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
});

type LaunchLocationFormData = z.infer<typeof launchLocationSchema>;

function LaunchLocationForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: LaunchLocationFormData;
  onSubmit: (data: LaunchLocationFormData) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LaunchLocationFormData>({
    resolver: zodResolver(launchLocationSchema),
    defaultValues:
      defaultValues || {
        name: '',
        address: '',
        timezone:
          Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_US_TIMEZONE,
      },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <Input
          id="name"
          type="text"
          placeholder="e.g. Online or Virtual"
          {...register('name')}
        />
        <p className="mt-1 text-xs text-gray-500">All meets are online; this is for timezone and display.</p>
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address (optional)
        </label>
        <Input
          id="address"
          type="text"
          placeholder="Leave blank for online-only"
          {...register('address')}
        />
      </div>
      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
          US timezone
        </label>
        <select
          id="timezone"
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('timezone')}
        >
          {US_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        {errors.timezone && <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Launch Location'}
        </Button>
      </div>
    </form>
  );
}

export default function LocationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useAppToast();

  const { data: clinic, isLoading } = useQuery({
    queryKey: ['admin-clinic', 'current'],
    queryFn: () => getCurrentClinic(),
    enabled: user?.role === 'SUPER_ADMIN' && !!user?.clinicId,
  });

  const saveMutation = useMutation({
    mutationFn: (data: LaunchLocationFormData) =>
      upsertLaunchLocation({
        id: clinic?.launchLocation?.id,
        name: data.name,
        address: data.address || undefined,
        timezone: data.timezone,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinic', 'current'] });
      toast.success('Launch location saved');
    },
    onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(error.response?.data?.message ?? error.message ?? 'Unable to save location');
    },
  });

  const clinicId = user?.clinicId ?? undefined;

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Location" description="Launch location settings are limited to super admins." />
        <AppEmptyState
          title="Access restricted"
          description="Only super admins can manage the launch location."
        />
      </div>
    );
  }

  if (!clinicId) {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Location" description="Complete clinic setup before editing the launch location." />
        <AppEmptyState
          title="Clinic setup required"
          description="Create the clinic first, then return here to update its launch location."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Launch Location"
        description="The admin UI is single-location for now, while the backend stays multi-location ready."
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Primary Operational Location</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading location settings...</p>
          ) : (
            <LaunchLocationForm
              defaultValues={{
                name: clinic?.launchLocation?.name ?? '',
                address: clinic?.launchLocation?.address ?? '',
                timezone: (() => {
                  const tz = clinic?.launchLocation?.timezone ?? '';
                  return (US_TIMEZONE_VALUES as readonly string[]).includes(tz) ? tz : DEFAULT_US_TIMEZONE;
                })(),
              }}
              onSubmit={(values) => saveMutation.mutate(values)}
              isSubmitting={saveMutation.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
