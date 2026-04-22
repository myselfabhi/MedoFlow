'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppButton } from '@/components/ui-system';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sparkles,
  CalendarClock,
  Receipt,
  ShoppingBag,
  UserCircle2,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  highlights: string[];
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Medoflow',
    description: 'Your personal care hub — book visits, track records and manage billing, all from one place.',
    icon: Sparkles,
    accent: 'from-primary via-primary-700 to-accent-700',
    highlights: [
      'Trusted by modern clinics',
      'End-to-end encrypted & HIPAA-ready',
      'Desktop and mobile friendly',
    ],
  },
  {
    title: 'Book in seconds',
    description: 'Browse our store, pick a service, and grab a time slot that fits your week.',
    icon: ShoppingBag,
    accent: 'from-accent-700 via-accent-600 to-primary',
    highlights: [
      'Browse by service or provider',
      'Real-time availability',
      'Secure checkout',
    ],
  },
  {
    title: 'Track everything',
    description: 'Your appointments, visit notes and prescriptions live in your profile menu — top right.',
    icon: CalendarClock,
    accent: 'from-primary via-primary-800 to-primary-950',
    highlights: [
      'Upcoming & past visits',
      'Downloadable receipts',
      'Provider messages',
    ],
  },
  {
    title: "You're all set",
    description: 'Jump in by clicking your avatar in the navigation bar. We\'ll be here when you need us.',
    icon: UserCircle2,
    accent: 'from-accent via-accent-700 to-primary-700',
    highlights: [
      'My Appointments',
      'Health Records',
      'Billing, Settings & more',
    ],
  },
];

export function PatientOnboardingTour() {
  const { user, markPatientTourSeen } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (user?.role === 'PATIENT' && user.hasSeenPatientTour === false) {
      const t = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [user]);

  if (!user || user.role !== 'PATIENT') return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const finish = async () => {
    setIsOpen(false);
    await markPatientTourSeen();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) finish();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-slate-100 bg-white p-0 overflow-hidden">
        <div className={cn('relative bg-gradient-to-br p-8 pt-10 text-white', current.accent)}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <DialogHeader className="sr-only">
            <DialogTitle>{current.title}</DialogTitle>
            <DialogDescription>{current.description}</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Icon className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black leading-tight">{current.title}</h2>
            <p className="mt-2 text-sm text-white/85">{current.description}</p>

            <ul className="mt-6 space-y-2">
              {current.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-white/90">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-white p-5">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === step ? 'w-8 bg-primary' : i < step ? 'w-1.5 bg-accent' : 'w-1.5 bg-slate-200'
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </AppButton>
            )}
            {!isLast ? (
              <>
                <button
                  onClick={finish}
                  className="px-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Skip tour
                </button>
                <AppButton
                  size="sm"
                  onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
                  className="rounded-full"
                >
                  Next <ArrowRight className="ml-1 h-4 w-4" />
                </AppButton>
              </>
            ) : (
              <AppButton size="sm" onClick={finish} className="rounded-full">
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </AppButton>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
