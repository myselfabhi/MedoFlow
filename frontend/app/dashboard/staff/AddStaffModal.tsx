'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppButton, AppInput } from '@/components/ui-system';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { inviteStaff, type StaffRole, type Permission } from '@/lib/staffApi';
import { getDisciplines } from '@/lib/disciplineApi';
import { getDashboardServices } from '@/lib/serviceApi';
import { useAppToast } from '@/hooks/useAppToast';

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: StaffRole; label: string; description: string }[] = [
  { value: 'FRONT_DESK', label: 'Front Desk', description: 'Reception & scheduling' },
  { value: 'PROVIDER', label: 'Provider', description: 'Clinical staff / therapist' },
  { value: 'ACCOUNTING', label: 'Accounting', description: 'Billing & financial ops' },
  { value: 'MARKETING', label: 'Marketing', description: 'Growth & promotions' },
];

// ─── Permissions config ───────────────────────────────────────────────────────

const PERMISSIONS_CONFIG = [
  {
    module: 'Clinical',
    actions: [
      { action: 'view_patients', label: 'View Patients' },
      { action: 'manage_appointments', label: 'Manage Appointments' },
      { action: 'view_records', label: 'View Clinical Records' },
    ],
  },
  {
    module: 'Financial',
    actions: [
      { action: 'view_billing', label: 'View Billing' },
      { action: 'process_payments', label: 'Process Payments' },
      { action: 'view_reports', label: 'View Financial Reports' },
    ],
  },
  {
    module: 'Commerce',
    actions: [
      { action: 'manage_products', label: 'Manage Products' },
      { action: 'manage_memberships', label: 'Manage Memberships' },
    ],
  },
  {
    module: 'Admin',
    actions: [
      { action: 'manage_staff', label: 'Manage Staff' },
      { action: 'view_analytics', label: 'View Analytics' },
    ],
  },
];

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  FRONT_DESK: ['view_patients', 'manage_appointments', 'view_billing', 'process_payments'],
  ACCOUNTING: ['view_billing', 'process_payments', 'view_reports'],
  MARKETING: ['manage_products', 'view_analytics'],
};

// ─── Form schema ──────────────────────────────────────────────────────────────

const staffSchema = z.object({
  role: z.enum(['FRONT_DESK', 'PROVIDER', 'ACCOUNTING', 'MARKETING']),
  name: z.string().optional(),
  email: z.string().email('Valid email is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  disciplineIds: z.array(z.string()).optional(),
  serviceIds: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.role !== 'PROVIDER' && (!data.name || data.name.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Full name is required', path: ['name'] });
  }
  if (data.role === 'PROVIDER') {
    if (!data.firstName || data.firstName.trim() === '')
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'First name is required', path: ['firstName'] });
    if (!data.lastName || data.lastName.trim() === '')
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Last name is required', path: ['lastName'] });
    if (!data.disciplineIds || data.disciplineIds.length === 0)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select at least one discipline', path: ['disciplineIds'] });
    if (!data.serviceIds || data.serviceIds.length === 0)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select at least one service', path: ['serviceIds'] });
  }
});

type StaffFormData = z.infer<typeof staffSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export function AddStaffModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const [role, setRole] = useState<StaffRole>('FRONT_DESK');
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set(DEFAULT_PERMISSIONS['FRONT_DESK']));

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: { role: 'FRONT_DESK', name: '', email: '', firstName: '', lastName: '', disciplineIds: [], serviceIds: [] },
  });

  const selectedDisciplineIds = watch('disciplineIds') || [];
  const selectedServiceIds = watch('serviceIds') || [];

  const { data: disciplines = [] } = useQuery({
    queryKey: ['disciplines'],
    queryFn: getDisciplines,
    enabled: open && role === 'PROVIDER',
  });

  const { data: allServices = [] } = useQuery({
    queryKey: ['dashboard-services'],
    queryFn: getDashboardServices,
    enabled: open && role === 'PROVIDER',
  });

  const filteredServices = allServices.filter((s) => selectedDisciplineIds.includes(s.discipline.id));

  const handleRoleChange = (newRole: StaffRole) => {
    setRole(newRole);
    setValue('role', newRole as any);
    setSelectedActions(new Set(DEFAULT_PERMISSIONS[newRole] ?? []));
  };

  const toggleAction = (action: string) => {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      next.has(action) ? next.delete(action) : next.add(action);
      return next;
    });
  };

  const inviteMutation = useMutation({
    mutationFn: (data: any) => inviteStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      reset();
      setSelectedActions(new Set(DEFAULT_PERMISSIONS['FRONT_DESK']));
      setRole('FRONT_DESK');
      toast.success('Staff invitation sent');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Unable to invite staff');
    },
  });

  const onSubmit = (data: StaffFormData) => {
    const permissions: Permission[] = Array.from(selectedActions).map((action) => {
      const module = PERMISSIONS_CONFIG.find((g) => g.actions.some((a) => a.action === action))?.module ?? 'Other';
      return { module, action };
    });

    const payload = {
      ...data,
      permissions: role !== 'PROVIDER' ? permissions : undefined,
      services: role === 'PROVIDER' ? data.serviceIds?.map((id) => ({ serviceId: id })) : undefined,
    };
    inviteMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite New Team Member</DialogTitle>
          <DialogDescription>Choose a role, set permissions, then send the invitation.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          {/* Role selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-col cursor-pointer border rounded-xl px-3 py-2.5 transition-colors ${
                    role === opt.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    value={opt.value}
                    checked={role === opt.value}
                    onChange={() => handleRoleChange(opt.value)}
                  />
                  <span className={`text-sm font-semibold ${role === opt.value ? 'text-primary' : 'text-slate-800'}`}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5">{opt.description}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <AppInput {...register('email')} placeholder="email@clinic.com" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Name fields — role-specific */}
          {role !== 'PROVIDER' ? (
            <div className="space-y-1">
              <label className="text-sm font-medium">Full Name</label>
              <AppInput {...register('name')} placeholder="Jamie Rivera" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">First Name</label>
                  <AppInput {...register('firstName')} placeholder="Jamie" />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Last Name</label>
                  <AppInput {...register('lastName')} placeholder="Rivera" />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Disciplines</label>
                <div className="border rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5 bg-slate-50">
                  {disciplines.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No disciplines found. Create one first.</p>
                  ) : disciplines.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        value={d.id}
                        checked={selectedDisciplineIds.includes(d.id)}
                        onChange={(e) => {
                          const newVal = e.target.checked
                            ? [...selectedDisciplineIds, d.id]
                            : selectedDisciplineIds.filter((id) => id !== d.id);
                          setValue('disciplineIds', newVal);
                        }}
                        className="accent-primary"
                      />
                      {d.name}
                    </label>
                  ))}
                </div>
                {errors.disciplineIds && <p className="text-xs text-red-500">{errors.disciplineIds.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Services</label>
                <div className="border rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5 bg-slate-50">
                  {selectedDisciplineIds.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Select disciplines first.</p>
                  ) : filteredServices.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No services for selected disciplines.</p>
                  ) : filteredServices.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        value={s.id}
                        checked={selectedServiceIds.includes(s.id)}
                        onChange={(e) => {
                          const newVal = e.target.checked
                            ? [...selectedServiceIds, s.id]
                            : selectedServiceIds.filter((id) => id !== s.id);
                          setValue('serviceIds', newVal);
                        }}
                        className="accent-primary"
                      />
                      {s.name} <span className="text-slate-400">({s.discipline.name})</span>
                    </label>
                  ))}
                </div>
                {errors.serviceIds && <p className="text-xs text-red-500">{errors.serviceIds.message}</p>}
              </div>
            </>
          )}

          {/* Permissions checklist — only for non-provider roles */}
          {role !== 'PROVIDER' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Permissions</label>
              <div className="border rounded-xl p-4 bg-slate-50 space-y-4">
                {PERMISSIONS_CONFIG.map((group) => (
                  <div key={group.module}>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{group.module}</p>
                    <div className="space-y-1.5">
                      {group.actions.map((item) => (
                        <label key={item.action} className="flex items-center gap-2.5 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={selectedActions.has(item.action)}
                            onChange={() => toggleAction(item.action)}
                            className="w-4 h-4 rounded accent-primary"
                          />
                          <span className="text-slate-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <AppButton type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</AppButton>
            <AppButton
              type="submit"
              disabled={inviteMutation.isPending || (role === 'PROVIDER' && disciplines.length === 0)}
            >
              {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
            </AppButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
