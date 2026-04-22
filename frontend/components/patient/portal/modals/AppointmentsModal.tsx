'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AppButton, AppEmptyState } from '@/components/ui-system';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getMyAppointments, type PatientAppointment } from '@/lib/patientApi';
import {
  CalendarClock,
  Clock,
  MapPin,
  Video,
  Plus,
  CalendarX,
  CalendarCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function AppointmentsModal({ open, onOpenChange }: Props) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => getMyAppointments(),
    enabled: open,
  });

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const upcoming: PatientAppointment[] = [];
    const past: PatientAppointment[] = [];
    appointments.forEach((a) => {
      if (new Date(a.startTime).getTime() >= now && a.status !== 'CANCELLED') {
        upcoming.push(a);
      } else {
        past.push(a);
      }
    });
    upcoming.sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
    past.sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime));
    return { upcoming, past };
  }, [appointments]);

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl border-slate-100 bg-white p-0 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary via-primary-700 to-accent-700 p-6 text-white">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-accent/30 blur-3xl" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">My Appointments</DialogTitle>
                <DialogDescription className="text-sm text-white/75">
                  View your upcoming visits and past history
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-100 bg-slate-50/60 px-6 pt-3">
          {(['upcoming', 'past'] as const).map((t) => {
            const isActive = tab === t;
            const count = t === 'upcoming' ? upcoming.length : past.length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'relative px-4 py-3 text-sm font-semibold transition-colors',
                  isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t === 'upcoming' ? 'Upcoming' : 'Past'}
                <span
                  className={cn(
                    'ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold',
                    isActive ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'
                  )}
                >
                  {count}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
            </div>
          ) : list.length === 0 ? (
            <AppEmptyState
              icon={tab === 'upcoming' ? <CalendarX className="h-6 w-6" /> : <CalendarCheck className="h-6 w-6" />}
              title={tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments yet'}
              description={
                tab === 'upcoming'
                  ? 'Book a visit with one of our providers to get started.'
                  : 'Your completed visits will appear here.'
              }
            />
          ) : (
            <ul className="space-y-3">
              {list.map((apt) => {
                const providerName = apt.provider?.user?.name || `${apt.provider?.firstName ?? ''} ${apt.provider?.lastName ?? ''}`.trim() || 'Provider';
                const isVirtual = !!apt.meetLink;
                return (
                  <li
                    key={apt.id}
                    className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 text-center">
                          <span className="text-[10px] font-bold uppercase text-primary/70">
                            {new Date(apt.startTime).toLocaleDateString(undefined, { month: 'short' })}
                          </span>
                          <span className="text-lg font-black leading-none text-primary">
                            {new Date(apt.startTime).getDate()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-semibold text-slate-900">
                            {apt.service?.name || 'Appointment'}
                          </h4>
                          <p className="truncate text-sm text-slate-500">with {providerName}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(apt.startTime)} · {formatTime(apt.startTime)}
                            </span>
                            {isVirtual ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-accent-700">
                                <Video className="h-3 w-3" />
                                Virtual
                              </span>
                            ) : (
                              apt.location?.name && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {apt.location.name}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>
                    {isVirtual && tab === 'upcoming' && (
                      <div className="mt-3 flex justify-end">
                        <AppButton size="sm" asChild className="rounded-full">
                          <a href={apt.meetLink!} target="_blank" rel="noreferrer">
                            <Video className="mr-1.5 h-3.5 w-3.5" />
                            Join visit
                          </a>
                        </AppButton>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <AppButton asChild className="w-full rounded-full">
            <Link href="/store" onClick={() => onOpenChange(false)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Book a new appointment
            </Link>
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
