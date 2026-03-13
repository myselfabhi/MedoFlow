'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { listProviders, deactivateProvider, type ProviderListItem } from '@/lib/availabilityApi';
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppButton,
  AppBadge,
  AppPageHeader,
  AppEmptyState,
  KPIStatCard
} from '@/components/ui-system';
import { PageContainer } from '@/components/layout';
import { AddProviderDialog } from '@/components/providers/AddProviderDialog';
import { EditProviderDialog } from '@/components/providers/EditProviderDialog';
import { Plus, Users, Stethoscope, MapPin, Calendar, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useAppToast } from '@/hooks/useAppToast';
import { useSystemModal } from '@/hooks/useSystemModal';
import { cn } from '@/lib/utils';

export default function ProvidersPage() {
  const { user } = useAuth();
  const clinicId = user?.clinicId?.trim() || undefined;
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const { showModal } = useSystemModal();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderListItem | null>(null);

  const canAddProvider = user?.role === 'SUPER_ADMIN';

  const { data: providers = [], isLoading, error } = useQuery({
    queryKey: ['providers'],
    queryFn: () => listProviders(),
    enabled: !!clinicId,
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider deactivated');
    },
    onError: () => toast.error('Failed to deactivate provider'),
  });

  const handleEditClick = (provider: ProviderListItem) => {
    setEditingProvider(provider);
    setEditDialogOpen(true);
  };

  const handleDeactivateClick = (provider: ProviderListItem) => {
    showModal({
      title: 'Deactivate Provider',
      description: `Deactivate ${provider.firstName} ${provider.lastName}? Their login will be disabled and future appointments will be flagged for reassignment. Historical data is preserved.`,
      actionLabel: 'Deactivate',
      onAction: () => deactivateMutation.mutate(provider.id),
    });
  };

  if (!clinicId) {
    return (
      <div className="p-8">
        <AppEmptyState
          title="Clinic Setup Required"
          description="Complete your clinic setup to manage your clinical team."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
      </div>
    );
  }

  const distinctSpecialties = new Set(
    providers.flatMap(p => p.disciplines?.map(d => d.discipline.name) || (p.discipline ? [p.discipline.name] : []))
  );

  return (
    <PageContainer className="space-y-8">
      <AppPageHeader
        title="Clinical Team"
        description="Manage your medical providers, their specialties, and availability."
        actions={
          canAddProvider ? (
            <AppButton onClick={() => setAddDialogOpen(true)} className="rounded-full px-6 shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Add Provider
            </AppButton>
          ) : undefined
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KPIStatCard 
          label="Total Providers"
          value={providers.length}
          icon={Users}
          iconClassName="text-blue-600 bg-blue-50"
        />
        <KPIStatCard 
          label="Specialties"
          value={distinctSpecialties.size}
          icon={Stethoscope}
          iconClassName="text-purple-600 bg-purple-50"
        />
        <KPIStatCard 
          label="Active Locations"
          value={1}
          icon={MapPin}
          iconClassName="text-emerald-600 bg-emerald-50"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => (
          <AppCard key={p.id} className="border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden group">
            <AppCardContent className="p-0">
              <div className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-xl text-slate-400 border-2 border-white shadow-sm">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{p.firstName} {p.lastName}</h3>
                      <p className="text-sm text-slate-500 font-medium">{p.email}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {(p.disciplines?.length
                        ? p.disciplines.map((pd) => pd.discipline.name)
                        : p.discipline
                          ? [p.discipline.name]
                          : ['General Practice']
                      ).map((name) => (
                        <AppBadge key={name} variant="secondary" className="rounded-lg px-2 py-1 text-xs font-bold bg-slate-100 text-slate-600 border-none">
                          {name}
                        </AppBadge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Services Offered</p>
                    <div className="flex flex-wrap gap-2">
                      {p.providerServices?.slice(0, 3).map((ps) => (
                        <span key={ps.id || ps.service.id} className="text-xs font-medium text-slate-600 bg-white border border-slate-100 px-2 py-1 rounded-lg">
                          {ps.service.name}
                        </span>
                      ))}
                      {p.providerServices && p.providerServices.length > 3 && (
                        <span className="text-xs font-black text-primary-600 mt-1">+{p.providerServices.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3">
                <AppButton variant="outline" size="sm" className="flex-1 rounded-full bg-white shadow-sm font-bold" asChild>
                  <Link href={`/dashboard/providers/${p.id}/availability`}>
                    <Calendar className="mr-2 h-3.5 w-3.5 text-primary-600" /> Availability
                  </Link>
                </AppButton>
                {canAddProvider && (
                  <div className="flex gap-2">
                    <AppButton variant="ghost" size="icon" className="rounded-full hover:bg-white hover:shadow-sm text-slate-400 hover:text-primary-600" onClick={() => handleEditClick(p)}>
                      <Edit2 className="h-4 w-4" />
                    </AppButton>
                    <AppButton variant="ghost" size="icon" className="rounded-full hover:bg-white hover:shadow-sm text-slate-400 hover:text-rose-600" onClick={() => handleDeactivateClick(p)}>
                      <Trash2 className="h-4 w-4" />
                    </AppButton>
                  </div>
                )}
              </div>
            </AppCardContent>
          </AppCard>
        ))}
        {providers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <Users className="h-16 w-16 text-slate-100 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">Build your clinical team</h3>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto">Add your first provider to start offering clinical services to your patients.</p>
            {canAddProvider && (
              <AppButton onClick={() => setAddDialogOpen(true)} className="mt-8 rounded-full px-8">
                Add First Provider
              </AppButton>
            )}
          </div>
        )}
      </div>

      <AddProviderDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      {editingProvider && (
        <EditProviderDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingProvider(null);
          }}
          provider={editingProvider}
        />
      )}
    </PageContainer>
  );
}
