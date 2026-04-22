'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AppButton } from '@/components/ui-system';
import {
  Settings,
  Bell,
  ShieldCheck,
  Globe,
  Moon,
  Sun,
  Lock,
  Trash2,
  Download,
  Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Section = 'notifications' | 'privacy' | 'preferences' | 'security';

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-slate-200'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

const LANGS = ['English', 'Español', 'Français', 'हिंदी'];

export function SettingsModal({ open, onOpenChange }: Props) {
  const [section, setSection] = useState<Section>('notifications');
  const [emailReminders, setEmailReminders] = useState(true);
  const [smsReminders, setSmsReminders] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [shareHealth, setShareHealth] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState('English');

  const sections: { id: Section; label: string; icon: any }[] = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl border-slate-100 bg-white p-0 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="relative bg-gradient-to-br from-slate-900 via-primary-900 to-primary p-6 text-white">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Settings</DialogTitle>
                <DialogDescription className="text-sm text-white/75">
                  Customize how Medoflow works for you
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <nav className="hidden w-52 shrink-0 border-r border-slate-100 bg-slate-50/50 p-3 sm:block">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = section === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Mobile tabs */}
          <div className="absolute left-0 right-0 top-24 z-10 flex gap-1 overflow-x-auto border-b border-slate-100 bg-white px-4 py-2 sm:hidden">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold',
                  section === s.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-6 sm:pt-6 mt-14 sm:mt-0">
            {section === 'notifications' && (
              <div className="space-y-3">
                <ToggleRow
                  label="Email appointment reminders"
                  description="Get email pings 24 hours before your visit."
                  checked={emailReminders}
                  onChange={setEmailReminders}
                />
                <ToggleRow
                  label="SMS reminders"
                  description="Text reminders for upcoming appointments."
                  checked={smsReminders}
                  onChange={setSmsReminders}
                />
                <ToggleRow
                  label="Wellness tips & offers"
                  description="Occasional updates from your clinic."
                  checked={marketing}
                  onChange={setMarketing}
                />
              </div>
            )}

            {section === 'privacy' && (
              <div className="space-y-3">
                <ToggleRow
                  label="Share health summary with my providers"
                  description="Lets in-network providers see your latest visit notes."
                  checked={shareHealth}
                  onChange={setShareHealth}
                />
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Data portability</p>
                  <p className="mt-0.5 text-xs text-slate-500">Download a copy of all your medical data.</p>
                  <AppButton variant="outline" size="sm" className="mt-3 rounded-full">
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Request export
                  </AppButton>
                </div>
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm font-semibold text-destructive">Delete my account</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Permanently remove your patient profile. Medical records are retained per law.
                  </p>
                  <AppButton variant="danger" size="sm" className="mt-3 rounded-full">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete account
                  </AppButton>
                </div>
              </div>
            )}

            {section === 'preferences' && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Appearance
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['light', 'dark'] as const).map((t) => {
                      const Icon = t === 'light' ? Sun : Moon;
                      const isActive = theme === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={cn(
                            'flex items-center gap-2 rounded-2xl border-2 p-4 text-left transition-all',
                            isActive
                              ? 'border-primary bg-primary-50/40'
                              : 'border-slate-100 bg-white hover:border-primary/30'
                          )}
                        >
                          <Icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-slate-400')} />
                          <span className={cn('text-sm font-semibold capitalize', isActive ? 'text-primary' : 'text-slate-600')}>
                            {t}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Languages className="h-3.5 w-3.5" />
                    Language
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGS.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={cn(
                          'rounded-full border px-4 py-2 text-sm font-semibold transition-all',
                          lang === l
                            ? 'border-primary bg-primary text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40'
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Time zone</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Auto-detected: <span className="font-medium text-slate-700">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                  </p>
                </div>
              </div>
            )}

            {section === 'security' && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Change password</p>
                  <p className="mt-0.5 text-xs text-slate-500">We'll send a secure link to your email.</p>
                  <AppButton variant="outline" size="sm" className="mt-3 rounded-full">
                    <Lock className="mr-1.5 h-3.5 w-3.5" />
                    Send reset link
                  </AppButton>
                </div>
                <ToggleRow
                  label="Two-factor authentication"
                  description="Extra security with a code from your phone."
                  checked={twoFactor}
                  onChange={setTwoFactor}
                />
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Active sessions</p>
                  <p className="mt-0.5 text-xs text-slate-500">You're signed in on 1 device.</p>
                  <AppButton variant="outline" size="sm" className="mt-3 rounded-full">
                    Sign out everywhere
                  </AppButton>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 p-4 flex justify-end gap-2">
          <AppButton variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            Close
          </AppButton>
          <AppButton onClick={() => onOpenChange(false)} className="rounded-full">
            Save changes
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
