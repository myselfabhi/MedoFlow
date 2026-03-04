'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type AppointmentStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export type InvoiceStatus = 'DRAFT' | 'FINALIZED' | 'PENDING_PAYMENT' | 'PAID';

export type TreatmentPlanStatus = 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED';

export type VisitRecordStatus = 'DRAFT' | 'FINAL';

const APPOINTMENT_MAP: Record<AppointmentStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-red-100 text-red-800',
  RESCHEDULED: 'bg-slate-100 text-slate-700',
};

const INVOICE_MAP: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  FINALIZED: 'bg-blue-100 text-blue-800',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
};

const TREATMENT_PLAN_MAP: Record<TreatmentPlanStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  COMPLETED: 'bg-slate-100 text-slate-700',
  DISCONTINUED: 'bg-red-100 text-red-800',
};

const VISIT_RECORD_MAP: Record<VisitRecordStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  FINAL: 'bg-green-100 text-green-800',
};

const ALL_MAP: Record<string, string> = {
  ...APPOINTMENT_MAP,
  ...INVOICE_MAP,
  ...TREATMENT_PLAN_MAP,
  ...VISIT_RECORD_MAP,
};

function formatLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

interface StatusBadgeProps {
  status: string;
  variant?: 'appointment' | 'invoice' | 'treatmentPlan' | 'visitRecord' | 'auto';
  className?: string;
}

export function StatusBadge({ status, variant = 'auto', className }: StatusBadgeProps) {
  const colorClass =
    variant === 'appointment'
      ? APPOINTMENT_MAP[status as AppointmentStatus]
      : variant === 'invoice'
        ? INVOICE_MAP[status as InvoiceStatus]
        : variant === 'treatmentPlan'
          ? TREATMENT_PLAN_MAP[status as TreatmentPlanStatus]
          : variant === 'visitRecord'
            ? VISIT_RECORD_MAP[status as VisitRecordStatus]
            : ALL_MAP[status] ?? 'bg-gray-100 text-gray-600';

  return (
    <Badge
      variant="outline"
      className={cn('font-medium', colorClass, 'border-0', className)}
    >
      {formatLabel(status)}
    </Badge>
  );
}
