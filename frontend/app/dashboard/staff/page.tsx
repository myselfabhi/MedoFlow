'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppPageHeader, AppEmptyState } from '@/components/ui-system';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { listStaff, deactivateStaff } from '@/lib/staffApi';
import { useAppToast } from '@/hooks/useAppToast';
import { Trash2, UserPlus } from 'lucide-react';
import { AddStaffModal } from './AddStaffModal';

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
      <div className="space-y-6">
        <AppPageHeader title="Staff" description="Manage your clinic team." />
        <AppEmptyState
          title="Access restricted"
          description="Only administrators can manage clinic staff."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <AppPageHeader
          title="Staff"
          description="Manage your clinic's providers and administration team."
        />
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Staff
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clinic Team</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Loading team members...</p>
          ) : staff.length === 0 ? (
            <AppEmptyState
              title="No staff yet"
              description="Invite your first team member to start managing your clinic."
            />
          ) : (
            <div className="space-y-3">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant={
                      member.role === 'SUPER_ADMIN' ? 'default' : 
                      member.role === 'PROVIDER' ? 'outline' : 'secondary'
                    }>
                      {member.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                       member.role === 'PROVIDER' ? 'Provider' : 'Front Desk'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(member.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {member.id !== user?.id && member.role !== 'SUPER_ADMIN' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeactivate(member.id, member.name)}
                        disabled={deactivateMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddStaffModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />
    </div>
  );
}
