'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useClinic } from '@/contexts/ClinicContext';
import { useClinicGuard } from '@/hooks/useClinicGuard';
import {
  getInvoices,
  payInvoice,
  type Invoice,
} from '@/lib/invoiceApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
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
  const { clinicId } = useClinicGuard();
  const router = useRouter();
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const effectiveClinicId = clinicId ?? user?.clinicId ?? undefined;
  const { clinics } = useClinic();
  const hasNoClinics = user?.role === 'SUPER_ADMIN' && clinics.length === 0;

  const isAllowed =
    user?.role === 'STAFF' ||
    user?.role === 'CLINIC_ADMIN' ||
    user?.role === 'SUPER_ADMIN';

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', 'clinic', effectiveClinicId, statusFilter],
    queryFn: () => getInvoices(effectiveClinicId, statusFilter === 'ALL' ? undefined : statusFilter),
    enabled: !!effectiveClinicId,
  });

  const payMutation = useMutation({
    mutationFn: (invoiceId: string) => payInvoice(invoiceId, effectiveClinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice marked as paid');
    },
    onError: () => toast.error('Failed to mark invoice as paid'),
  });

  if (!effectiveClinicId && isAllowed) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <EmptyState
          title={
            hasNoClinics
              ? 'Oops! No Clinics Found'
              : user?.role === 'SUPER_ADMIN'
                ? 'No clinic selected'
                : 'No clinic assigned'
          }
          description={
            hasNoClinics
              ? "You haven't created any clinics yet. Create a clinic to begin setting up providers and services."
              : user?.role === 'SUPER_ADMIN'
                ? 'Select a clinic from the top-right to manage invoices.'
                : 'You are not assigned to a clinic.'
          }
          actionLabel={hasNoClinics ? 'Create Clinic' : undefined}
          onAction={hasNoClinics ? () => (window.location.href = '/dashboard/clinics/new') : undefined}
        />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">Access denied. This page is for front desk staff and clinic admins only.</p>
          <Link href="/dashboard" className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-700">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <p className="mt-1 text-sm text-gray-500">Manage clinic invoices and billing</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Invoices</CardTitle>
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
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Appointment Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 p-0 align-top">
                      <EmptyState
                        title="No invoices found"
                        description="Create an invoice from an appointment to get started."
                        actionLabel="View appointments"
                        onAction={() => router.push('/dashboard/appointments')}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv: Invoice) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{formatPatient(inv)}</TableCell>
                        <TableCell>{formatProvider(inv)}</TableCell>
                        <TableCell>{formatAppointmentDate(inv)}</TableCell>
                        <TableCell>
                          <StatusBadge status={inv.status} variant="invoice" />
                        </TableCell>
                        <TableCell className="text-right">{inv.totalAmount ?? '0.00'}</TableCell>
                        <TableCell className="text-right">
                          {inv.status === 'FINALIZED' && (
                            <Button
                              size="sm"
                              onClick={() => payMutation.mutate(inv.id)}
                              disabled={payMutation.isPending}
                            >
                              Mark Paid
                            </Button>
                          )}
                          {inv.status === 'DRAFT' && (
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <Link href={`/dashboard/provider/appointments/${inv.appointmentId}`}>
                                Open
                              </Link>
                            </Button>
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
        </CardContent>
      </Card>
    </div>
  );
}
