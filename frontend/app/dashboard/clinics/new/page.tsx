'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCurrentClinic,
  setupClinic,
  updateClinic,
  upsertLaunchLocation,
} from '@/lib/clinicAdminApi';
import { AppPageHeader, AppEmptyState } from '@/components/ui-system';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppToast } from '@/hooks/useAppToast';

import { US_TIMEZONES, DEFAULT_US_TIMEZONE } from '@/lib/constants/timezones';

const clinicSetupSchema = z.object({
  name: z.string().min(1, 'Clinic name is required'),
  email: z.string().email('Valid clinic email is required'),
  locationName: z.string().min(1, 'Location name is required (e.g. Online)'),
  locationAddress: z.string().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
});

type ClinicSetupFormData = z.infer<typeof clinicSetupSchema>;

export default function CreateClinicPage() {
  const { user } = useAuth();
  const toast = useAppToast();
  const queryClient = useQueryClient();

  const { data: clinic, isLoading } = useQuery({
    queryKey: ['admin-clinic', 'current'],
    queryFn: () => getCurrentClinic(),
    enabled: user?.role === 'SUPER_ADMIN',
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClinicSetupFormData>({
    resolver: zodResolver(clinicSetupSchema),
    defaultValues: {
      name: '',
      email: '',
      locationName: '',
      locationAddress: '',
      timezone: DEFAULT_US_TIMEZONE,
    },
  });

  React.useEffect(() => {
    if (!clinic) return;
    reset({
      name: clinic.name,
      email: clinic.email,
      locationName: clinic.launchLocation?.name ?? '',
      locationAddress: clinic.launchLocation?.address ?? '',
      timezone: clinic.launchLocation?.timezone ?? DEFAULT_US_TIMEZONE,
    });
  }, [clinic, reset]);

  const saveMutation = useMutation({
    mutationFn: async (values: ClinicSetupFormData) => {
      if (!clinic) {
        return setupClinic({
          name: values.name,
          email: values.email,
          location: {
            name: values.locationName,
            address: values.locationAddress || undefined,
            timezone: values.timezone,
          },
        });
      }

      await Promise.all([
        updateClinic({ name: values.name, email: values.email }),
        upsertLaunchLocation({
          id: clinic.launchLocation?.id,
          name: values.locationName,
          address: values.locationAddress || undefined,
          timezone: values.timezone,
        }),
      ]);

      return getCurrentClinic();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinic', 'current'] });
      toast.success(clinic ? 'Clinic settings saved' : 'Clinic setup completed');
    },
    onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(error.response?.data?.message ?? error.message ?? 'Unable to save clinic settings');
    },
  });

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Clinic Setup" description="Clinic settings are limited to super admins." />
        <AppEmptyState
          title="Access restricted"
          description="Only super admins can create or update clinic settings."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        title={clinic ? 'Clinic Settings' : 'Clinic Setup'}
        description={
          clinic
            ? 'Manage your clinic identity and launch location.'
            : 'Complete the initial clinic setup before inviting staff or configuring providers.'
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{clinic ? 'Clinic Profile' : 'Launch Your Clinic'}</CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            Keep the UI single-location for launch while preserving the multi-location-ready data model underneath.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading clinic settings...</p>
          ) : (
            <form onSubmit={handleSubmit((values) => saveMutation.mutate(values))} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Clinic name</label>
                  <Input {...register('name')} placeholder="Medoflow Clinic" />
                  {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Clinic email</label>
                  <Input {...register('email')} type="email" placeholder="hello@clinic.com" />
                  {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background/60 p-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900">Location (all meets are online)</h3>
                  <p className="text-sm text-slate-600">
                    One location is used for timezone and scheduling. Name it e.g. &quot;Online&quot; or &quot;Virtual&quot;.
                  </p>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Location name</label>
                    <Input {...register('locationName')} placeholder="e.g. Online or Virtual" />
                    {errors.locationName && (
                      <p className="text-sm text-danger">{errors.locationName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">US timezone</label>
                    <select
                      {...register('timezone')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {US_TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    {errors.timezone && (
                      <p className="text-sm text-danger">{errors.timezone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Address (optional)</label>
                    <Input
                      {...register('locationAddress')}
                      placeholder="Leave blank for online-only"
                    />
                  </div>
                </div>
              </div>

              {clinic && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Providers</p>
                    <p className="mt-1 text-2xl font-semibold">{clinic.stats.providerCount}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Front desk staff</p>
                    <p className="mt-1 text-2xl font-semibold">{clinic.stats.staffCount}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Active locations</p>
                    <p className="mt-1 text-2xl font-semibold">{clinic.stats.locationCount}</p>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? clinic
                    ? 'Saving...'
                    : 'Setting up...'
                  : clinic
                    ? 'Save Clinic Settings'
                    : 'Complete Clinic Setup'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
