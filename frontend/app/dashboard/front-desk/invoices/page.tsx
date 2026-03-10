'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getInvoices,
  payInvoice,
  type Invoice,
} from '@/lib/invoiceApi';
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppButton,
  AppPageHeader,
  AppEmptyState,
} from '@/components/ui-system';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppToast } from '@/hooks/useAppToast';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'FINALIZED', label: 'Finalized' },
  { value: 'PAID', label: 'Paid' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPatient(inv: Invoice) {
  if (inv.patient?.name) return inv.patient.name;
  return '—';
}

function formatProvider(inv: Invoice) {
  if (inv.provider) {
    return `${inv.provider.firstName} ${inv.provider.lastName}`;
  }
  return '—';
}

function formatAppointmentDate(inv: Invoice) {
  if (inv.appointment?.startTime) {
    return formatDate(inv.appointment.startTime);
  }
  return '—';
}

export default function FrontDeskInvoicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const clinicId = user?.clinicId ?? undefined;

  const isAllowed =
    user?.role === 'FRONT_DESK' || user?.role === 'SUPER_ADMIN';

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () =>
      getInvoices(statusFilter === 'ALL' ? undefined : statusFilter),
    enabled: !!clinicId,
  });

  const payMutation = useMutation({
    mutationFn: (invoiceId: string) => payInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice marked as paid');
    },
    onError: () => toast.error('Failed to mark invoice as paid'),
  });

  if (!clinicId && isAllowed) {
    return (
      <div className="space-y-6">
        <AppPageHeader
          title="Invoices"
          description="Manage clinic invoices and billing"
        />
        <AppEmptyState
          title="No clinic assigned"
          description="You are not assigned to a clinic. Contact your administrator."
        />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="space-y-6">
        <AppPageHeader
          title="Invoices"
          description="Manage clinic invoices and billing"
        />
        <AppCard>
          <AppCardContent>
            <div className="rounded-lg border border-danger/20 bg-danger/5 p-6 text-center">
              <p className="text-sm text-danger">
                Access denied. This page is for front desk staff only.
              </p>
              <Link
                href="/dashboard"
                className="mt-3 inline-block text-sm text-accent hover:underline"
              >
                ← Back to dashboard
              </Link>
            </div>
          </AppCardContent>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Invoices"
        description="Manage clinic invoices and billing"
      />

      <AppCard>
        <AppCardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <AppCardTitle>Invoices</AppCardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </AppCardHeader>
        <AppCardContent>
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/80 hover:bg-transparent">
                    <TableHead className="h-12 px-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Patient
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Provider
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Appointment Date
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Status
                    </TableHead>
                    <TableHead className="h-12 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                      Total
                    </TableHead>
                    <TableHead className="h-12 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={6}
                        className="h-48 p-0 align-top"
                      >
                        <AppEmptyState
                          title="No invoices found"
                          description="Create an invoice from an appointment to get started."
                          actionLabel="View appointments"
                          onAction={() =>
                            router.push('/dashboard/appointments')
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((inv: Invoice) => (
                      <TableRow
                        key={inv.id}
                        className="border-slate-200/60 hover:bg-slate-50/50"
                      >
                        <TableCell className="px-4 py-3 font-medium text-slate-900">
                          {formatPatient(inv)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-slate-600">
                          {formatProvider(inv)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-slate-600">
                          {formatAppointmentDate(inv)}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <StatusBadge status={inv.status} variant="invoice" />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-slate-600">
                          {inv.totalAmount ?? '0.00'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          {inv.status === 'FINALIZED' && (
                            <AppButton
                              size="sm"
                              onClick={() => payMutation.mutate(inv.id)}
                              disabled={payMutation.isPending}
                            >
                              Mark Paid
                            </AppButton>
                          )}
                          {inv.status === 'DRAFT' && (
                            <AppButton size="sm" variant="outline" asChild>
                              <Link
                                href={`/dashboard/provider/appointments/${inv.appointmentId}`}
                              >
                                Open
                              </Link>
                            </AppButton>
                          )}
                          {inv.status === 'PAID' && (
                            <StatusBadge status="PAID" variant="invoice" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </AppCardContent>
      </AppCard>
    </div>
  );
}
