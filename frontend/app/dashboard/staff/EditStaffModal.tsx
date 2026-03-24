'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppButton } from '@/components/ui-system';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { updateStaff, linkProviderToAdmin, type StaffMember, type StaffRole, type Permission } from '@/lib/staffApi';
import { useAppToast } from '@/hooks/useAppToast';
import { ShieldCheck } from 'lucide-react';

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'FRONT_DESK', label: 'Front Desk' },
  { value: 'ACCOUNTING', label: 'Accounting' },
  { value: 'MARKETING', label: 'Marketing' },
];

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

const DEFAULT_PERMISSIONS: Record<StaffRole, string[]> = {
  SUPER_ADMIN: ['view_patients', 'manage_appointments', 'view_records', 'view_billing', 'process_payments', 'view_reports', 'manage_products', 'manage_memberships', 'manage_staff', 'view_analytics'],
  PROVIDER: ['view_patients', 'manage_appointments', 'view_records'],
  FRONT_DESK: ['view_patients', 'manage_appointments', 'view_billing', 'process_payments'],
  ACCOUNTING: ['view_billing', 'process_payments', 'view_reports'],
  MARKETING: ['manage_products', 'view_analytics'],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: StaffMember;
}

export function EditStaffModal({ open, onOpenChange, member }: Props) {
  const toast = useAppToast();
  const queryClient = useQueryClient();

  const [role, setRole] = useState<StaffRole>(member.role);
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());

  // Initialise permissions from existing member or role defaults
  useEffect(() => {
    if (open) {
      setRole(member.role);
      if (member.permissions && member.permissions.length > 0) {
        setSelectedActions(new Set(member.permissions.map((p) => p.action)));
      } else {
        setSelectedActions(new Set(DEFAULT_PERMISSIONS[member.role] ?? []));
      }
    }
  }, [open, member]);

  // When role changes, apply default permissions for that role
  const handleRoleChange = (newRole: StaffRole) => {
    setRole(newRole);
    setSelectedActions(new Set(DEFAULT_PERMISSIONS[newRole] ?? []));
  };

  const toggleAction = (action: string) => {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      next.has(action) ? next.delete(action) : next.add(action);
      return next;
    });
  };

  const updateMutation = useMutation({
    mutationFn: () => {
      const permissions: Permission[] = Array.from(selectedActions).map((action) => {
        const module = PERMISSIONS_CONFIG.find((g) => g.actions.some((a) => a.action === action))?.module ?? 'Other';
        return { module, action };
      });
      return updateStaff(member.id, { role, permissions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member updated');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? error.message ?? 'Unable to update staff');
    },
  });

  const linkProviderMutation = useMutation({
    mutationFn: () => linkProviderToAdmin(member.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Provider profile linked to this admin');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? error.message ?? 'Unable to link provider');
    },
  });

  const isAdmin = member.role === 'SUPER_ADMIN';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>{member.name} · {member.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Role selector — hide for SUPER_ADMIN to prevent accidental downgrades */}
          {!isAdmin && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.filter((r) => r.value !== 'SUPER_ADMIN').map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 text-sm transition-colors ${
                      role === opt.value
                        ? 'border-primary bg-primary/5 text-primary font-semibold'
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
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Permissions checklist */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">Permissions</label>
            <div className="space-y-4 border rounded-xl p-4 bg-slate-50">
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
                          className="w-4 h-4 rounded text-primary accent-primary"
                        />
                        <span className="text-slate-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Link-as-provider toggle (admin only) */}
          {isAdmin && (
            <div className="border rounded-xl p-4 bg-blue-50/50 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-semibold text-slate-800">Provider Access</p>
              </div>
              <p className="text-xs text-slate-500">
                Allow this admin to also act as a clinical provider and appear in scheduling.
              </p>
              {member.provider ? (
                <p className="text-xs font-semibold text-emerald-600">Provider profile already linked.</p>
              ) : (
                <AppButton
                  size="sm"
                  variant="outline"
                  className="mt-1"
                  onClick={() => linkProviderMutation.mutate()}
                  disabled={linkProviderMutation.isPending}
                >
                  {linkProviderMutation.isPending ? 'Linking...' : 'Link as Provider'}
                </AppButton>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <AppButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </AppButton>
          <AppButton
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
