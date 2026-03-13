'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  AppPageHeader, 
  AppEmptyState,
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppButton,
  KPIStatCard,
  AppTable
} from '@/components/ui-system';
import { PageContainer } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { listStaff, deactivateStaff } from '@/lib/staffApi';
import { useAppToast } from '@/hooks/useAppToast';
import { Trash2, UserPlus, ShieldCheck, Users, Mail, Clock } from 'lucide-react';
import { AddStaffModal } from './AddStaffModal';
import { cn } from '@/lib/utils';

export default function StaffPage() {
  const { user } = useAuth();
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => listStaff(),
    enabled: !!user?.clinicId,
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member deactivated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? error.message ?? 'Unable to deactivate staff');
    },
  });

  const handleDeactivate = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to deactivate ${name}?`)) {
      deactivateMutation.mutate(id);
    }
  };

  const isAuthorized = user?.role === 'SUPER_ADMIN' || user?.role === 'FRONT_DESK';

  if (!isAuthorized) {
    return (
      <div className="p-8">
        <AppEmptyState
          title="Access Restricted"
          description="Only administrators can manage clinic staff."
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

  return (
    <PageContainer className="space-y-8">
      <AppPageHeader
        title="Internal Team"
        description="Manage your clinic's administrators and operational support staff."
        actions={
          <AppButton onClick={() => setIsModalOpen(true)} className="rounded-full px-6 shadow-md">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </AppButton>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KPIStatCard 
          label="Team Size"
          value={staff.length}
          icon={Users}
          iconClassName="text-blue-600 bg-blue-50"
        />
        <KPIStatCard 
          label="Admins"
          value={staff.filter(s => s.role === 'SUPER_ADMIN').length}
          icon={ShieldCheck}
          iconClassName="text-purple-600 bg-purple-50"
        />
        <KPIStatCard 
          label="Latest Invite"
          value="Today"
          icon={Clock}
          iconClassName="text-emerald-600 bg-emerald-50"
        />
      </div>

      <AppCard className="border-none shadow-sm overflow-hidden bg-white">
        <AppCardHeader className="bg-white border-b-0 py-6 px-8">
          <AppCardTitle className="text-lg font-bold">Member Directory</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-0">
          <AppTable
            columns={[
              {
                key: 'member',
                header: 'Member',
                render: (m) => (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{m.email}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'role',
                header: 'System Role',
                render: (m) => (
                  <Badge className="rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest" variant={
                    m.role === 'SUPER_ADMIN' ? 'default' : 
                    m.role === 'PROVIDER' ? 'outline' : 'secondary'
                  }>
                    {m.role.replace('_', ' ')}
                  </Badge>
                ),
              },
              {
                key: 'joined',
                header: 'Joined On',
                render: (m) => (
                  <span className="text-xs font-medium text-slate-400">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: '',
                className: 'text-right',
                render: (m) => (
                  <div className="flex justify-end gap-2 pr-4">
                    {m.id !== user?.id && m.role !== 'SUPER_ADMIN' ? (
                      <AppButton 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full text-slate-400 hover:text-rose-600"
                        onClick={() => handleDeactivate(m.id, m.name)}
                        disabled={deactivateMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </AppButton>
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                  </div>
                ),
              }
            ]}
            data={staff}
            keyExtractor={(m) => m.id}
          />
        </AppCardContent>
      </AppCard>

      <AddStaffModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />
    </PageContainer>
  );
}
