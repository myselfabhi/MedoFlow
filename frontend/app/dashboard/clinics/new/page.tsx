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
import { 
  AppPageHeader, 
  AppEmptyState,
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
  AppButton,
  AppInput,
  KPIStatCard,
} from '@/components/ui-system';
import { PageContainer } from '@/components/layout';
import { useAppToast } from '@/hooks/useAppToast';
import { Users, Layout, Building2 } from 'lucide-react';

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
      <PageContainer className="space-y-8">
        <AppPageHeader title="Clinic Setup" description="Clinic settings are limited to super admins." />
        <AppEmptyState
          title="Access restricted"
          description="Only super admins can create or update clinic settings."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-8">
      <AppPageHeader
        title={clinic ? 'Clinic Settings' : 'Clinic Setup'}
        description={
          clinic
            ? 'Manage your clinic identity and launch location.'
            : 'Complete the initial clinic setup before inviting staff or configuring providers.'
        }
      />
      
      {clinic && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <KPIStatCard 
            label="Total Providers"
            value={clinic.stats.providerCount}
            icon={Users}
            iconClassName="text-blue-600 bg-blue-50"
          />
          <KPIStatCard 
            label="Staff Count"
            value={clinic.stats.staffCount}
            icon={Layout}
            iconClassName="text-purple-600 bg-purple-50"
          />
          <KPIStatCard 
            label="Active Locations"
            value={clinic.stats.locationCount}
            icon={Building2}
            iconClassName="text-emerald-600 bg-emerald-50"
          />
        </div>
      )}

      <AppCard>
        <AppCardHeader>
          <AppCardTitle>{clinic ? 'Clinic Profile' : 'Launch Your Clinic'}</AppCardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep the UI single-location for launch while preserving the multi-location-ready data model underneath.
          </p>
        </AppCardHeader>
        <AppCardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
            </div>
          ) : (
            <form onSubmit={handleSubmit((values) => saveMutation.mutate(values))} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-tighter">Clinic name</label>
                  <AppInput {...register('name')} placeholder="Medoflow Clinic" />
                  {errors.name && <p className="text-xs font-bold text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-tighter">Clinic email</label>
                  <AppInput {...register('email')} type="email" placeholder="hello@clinic.com" />
                  {errors.email && <p className="text-xs font-bold text-destructive">{errors.email.message}</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-slate-50/50 p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Primary Operating Location</h3>
                  <p className="text-sm text-slate-500">
                    This location defines your primary timezone and clinical operations.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-tighter">Location name</label>
                    <AppInput {...register('locationName')} placeholder="e.g. Online or Virtual" />
                    {errors.locationName && (
                      <p className="text-xs font-bold text-destructive">{errors.locationName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-tighter">US timezone</label>
                    <select
                      {...register('timezone')}
                      className="flex h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-accent outline-none"
                    >
                      {US_TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    {errors.timezone && (
                      <p className="text-xs font-bold text-destructive">{errors.timezone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-tighter">Address (optional)</label>
                    <AppInput
                      {...register('locationAddress')}
                      placeholder="Leave blank for online-only"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <AppButton type="submit" disabled={saveMutation.isPending} className="rounded-full px-8">
                  {saveMutation.isPending
                    ? clinic
                      ? 'Saving...'
                      : 'Setting up...'
                    : clinic
                      ? 'Save Clinic Settings'
                      : 'Complete Clinic Setup'}
                </AppButton>
              </div>
            </form>
          )}
        </AppCardContent>
      </AppCard>
    </PageContainer>
  );
}
