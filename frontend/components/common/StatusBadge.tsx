'use client';

import { AppBadge } from '@/components/ui-system';
import { cn } from '@/lib/utils';

export type AppointmentStatus =
  | 'DRAFT'
  | 'PENDING_PROVIDER_APPROVAL'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export type InvoiceStatus =
  | 'DRAFT'
  | 'FINALIZED'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CANCELLED'
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export type TreatmentPlanStatus = 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED';

export type VisitRecordStatus = 'DRAFT' | 'FINAL';

const APPOINTMENT_MAP: Record<AppointmentStatus, 'outline' | 'warning' | 'accent' | 'success' | 'destructive' | 'neutral'> = {
  DRAFT: 'outline',
  PENDING_PROVIDER_APPROVAL: 'warning',
  PENDING_PAYMENT: 'warning',
  CONFIRMED: 'accent',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
  NO_SHOW: 'destructive',
  RESCHEDULED: 'neutral',
};

const INVOICE_MAP: Record<InvoiceStatus, 'outline' | 'warning' | 'accent' | 'success' | 'destructive' | 'neutral'> = {
  DRAFT: 'outline',
  FINALIZED: 'accent',
  PENDING_PAYMENT: 'warning',
  PAID: 'success',
  CANCELLED: 'destructive',
  UNPAID: 'warning',
  PARTIALLY_PAID: 'accent',
  PARTIALLY_REFUNDED: 'neutral',
  REFUNDED: 'neutral',
};

const TREATMENT_PLAN_MAP: Record<TreatmentPlanStatus, 'success' | 'neutral' | 'destructive'> = {
  ACTIVE: 'success',
  COMPLETED: 'neutral',
  DISCONTINUED: 'destructive',
};

const VISIT_RECORD_MAP: Record<VisitRecordStatus, 'outline' | 'success'> = {
  DRAFT: 'outline',
  FINAL: 'success',
};

const ALL_MAP: Record<string, 'success' | 'warning' | 'destructive' | 'accent' | 'outline' | 'neutral'> = {
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
  const badgeVariant =
    variant === 'appointment'
      ? APPOINTMENT_MAP[status as AppointmentStatus]
      : variant === 'invoice'
        ? INVOICE_MAP[status as InvoiceStatus]
        : variant === 'treatmentPlan'
          ? TREATMENT_PLAN_MAP[status as TreatmentPlanStatus]
          : variant === 'visitRecord'
            ? VISIT_RECORD_MAP[status as VisitRecordStatus]
            : ALL_MAP[status] ?? 'outline';

  return (
    <AppBadge variant={badgeVariant} className={cn('font-medium', className)}>
      {formatLabel(status)}
    </AppBadge>
  );
}
