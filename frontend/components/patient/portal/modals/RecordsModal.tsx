'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AppEmptyState } from '@/components/ui-system';
import { getMyPrescriptions, type Prescription } from '@/lib/patientApi';
import { FileHeart, Pill, Calendar, UserCircle2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function RecordsModal({ open, onOpenChange }: Props) {
  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['patient-prescriptions'],
    queryFn: () => getMyPrescriptions(),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl border-slate-100 bg-white p-0 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="relative bg-gradient-to-br from-accent-700 via-accent-600 to-primary p-6 text-white">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <FileHeart className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Health Records</DialogTitle>
                <DialogDescription className="text-sm text-white/75">
                  Your prescriptions and visit history
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
            <Pill className="h-4 w-4" />
            Prescriptions
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-accent" />
            </div>
          ) : prescriptions.length === 0 ? (
            <AppEmptyState
              title="No prescriptions yet"
              description="Prescriptions issued during visits will appear here."
              icon={<Pill className="h-6 w-6" />}
            />
          ) : (
            <ul className="space-y-3">
              {prescriptions.map((rx: Prescription) => (
                <li
                  key={rx.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-accent/30 hover:shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-700">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-wrap text-sm font-medium text-slate-900">
                        {rx.notes}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <UserCircle2 className="h-3 w-3" />
                          Dr. {rx.provider.firstName} {rx.provider.lastName}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(rx.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              Visit notes and detailed medical records are shared at your provider's discretion.
              Contact your provider for a full copy of your chart.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
