'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getInvoices,
  payInvoice,
  type Invoice,
} from '@/lib/invoiceApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'FINALIZED', label: 'Finalized' },
  { value: 'PAID', label: 'Paid' },
];

const STATUS_BADGE: Record<string, { className: string }> = {
  DRAFT: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  FINALIZED: { className: 'bg-blue-100 text-blue-800 border-blue-200' },
  PAID: { className: 'bg-green-100 text-green-800 border-green-200' },
  CANCELLED: { className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

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
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');

  const isAllowed =
    user?.role === 'STAFF' ||
    user?.role === 'CLINIC_ADMIN' ||
    user?.role === 'SUPER_ADMIN';

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', 'clinic', user?.clinicId, statusFilter],
    queryFn: () => getInvoices(user?.clinicId ?? undefined, statusFilter === 'ALL' ? undefined : statusFilter),
    enabled: !!user?.clinicId || user?.role === 'SUPER_ADMIN',
  });

  const payMutation = useMutation({
    mutationFn: (invoiceId: string) => payInvoice(invoiceId, user?.clinicId ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice marked as paid');
    },
    onError: () => toast.error('Failed to mark invoice as paid'),
  });

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
                    <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv: Invoice) => {
                    const config = STATUS_BADGE[inv.status] ?? { className: 'bg-gray-100 text-gray-600' };
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{formatPatient(inv)}</TableCell>
                        <TableCell>{formatProvider(inv)}</TableCell>
                        <TableCell>{formatAppointmentDate(inv)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={config.className}>
                            {inv.status}
                          </Badge>
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
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              Paid
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
