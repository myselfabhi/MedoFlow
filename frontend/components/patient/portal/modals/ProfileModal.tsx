'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { UserCircle2, Mail, ShieldCheck, Building2, Copy, CheckCheck } from 'lucide-react';
import { AppButton } from '@/components/ui-system';
import { usePatientPortal } from '../PatientPortalContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Field({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="group flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition-colors hover:border-primary/20">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="opacity-0 transition-opacity group-hover:opacity-100 text-slate-400 hover:text-primary"
        aria-label={`Copy ${label}`}
      >
        {copied ? <CheckCheck className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function ProfileModal({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { open: openPortal } = usePatientPortal();
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-slate-100 bg-white p-0 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="relative bg-gradient-to-br from-primary via-primary-700 to-accent-600 p-6 pt-8 text-white">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-accent/30 blur-3xl" />
          <DialogHeader className="relative sr-only">
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>Your personal information</DialogDescription>
          </DialogHeader>
          <div className="relative flex flex-col items-center text-center">
            <UserAvatar
              seed={`${user.id}-${user.name}`}
              alt={user.name}
              className="h-20 w-20 ring-4 ring-white/30"
              sizes="80px"
            />
            <h2 className="mt-3 text-xl font-bold text-white">{user.name}</h2>
            <p className="text-sm text-white/75">{user.email}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <Field label="Full name" value={user.name} icon={UserCircle2} />
          <Field label="Email" value={user.email} icon={Mail} />
          <Field label="Role" value="Patient" icon={ShieldCheck} />
          {user.clinicId && <Field label="Clinic ID" value={user.clinicId} icon={Building2} />}

          <div className="mt-4 rounded-2xl border border-primary-100 bg-primary-50/50 p-4">
            <p className="text-xs text-slate-600">
              Need to update your details? Manage notifications, password and preferences in{' '}
              <button
                onClick={() => {
                  onOpenChange(false);
                  openPortal('settings');
                }}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Settings
              </button>
              , or reach out via{' '}
              <button
                onClick={() => {
                  onOpenChange(false);
                  openPortal('help');
                }}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Help & Support
              </button>
              .
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <AppButton variant="outline" onClick={() => onOpenChange(false)} className="w-full rounded-full">
            Close
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
