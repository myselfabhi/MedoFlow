'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppPageHeader, AppEmptyState } from '@/components/ui-system';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { inviteFrontDeskStaff, listFrontDeskStaff } from '@/lib/staffApi';
import { useAppToast } from '@/hooks/useAppToast';

const inviteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function StaffPage() {
  const { user } = useAuth();
  const toast = useAppToast();
  const queryClient = useQueryClient();

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['front-desk-staff'],
    queryFn: () => listFrontDeskStaff(),
    enabled: user?.role === 'SUPER_ADMIN' && !!user.clinicId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const inviteMutation = useMutation({
    mutationFn: inviteFrontDeskStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['front-desk-staff'] });
      reset();
      toast.success('Front desk invitation sent');
    },
    onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(error.response?.data?.message ?? error.message ?? 'Unable to invite staff');
    },
  });

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Staff" description="Only super admins can provision staff." />
        <AppEmptyState
          title="Access restricted"
          description="Front desk staff can only be invited by a super admin."
        />
      </div>
    );
  }

  if (!user.clinicId) {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Staff" description="Complete clinic setup before inviting staff." />
        <AppEmptyState
          title="Clinic setup required"
          description="Finish clinic setup first so new staff can be scoped to the correct clinic."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Staff"
        description="Invite front desk staff. Provider onboarding stays in the provider workflow so identity, services, and pricing are linked together."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Front Desk Team</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading staff...</p>
            ) : staff.length === 0 ? (
              <AppEmptyState
                title="No front desk staff yet"
                description="Invite your first team member to handle scheduling, patient intake, and operational workflows."
              />
            ) : (
              <div className="space-y-3">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Front Desk
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Invited {new Date(member.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite Front Desk Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => inviteMutation.mutate(values))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full name</label>
                <Input {...register('name')} placeholder="Jamie Rivera" />
                {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Work email</label>
                <Input {...register('email')} type="email" placeholder="jamie@clinic.com" />
                {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
              </div>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? 'Sending invite...' : 'Send Invite'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
