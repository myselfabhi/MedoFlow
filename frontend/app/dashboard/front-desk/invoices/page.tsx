'use client';

import React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getFilteredInvoices,
  getFinanceSummary,
  getReceivablesSummary,
  recordManualInvoicePayment,
  refundPayment,
  type Invoice,
  type InvoicePayment,
} from '@/lib/invoiceApi';
import { listProviders } from '@/lib/availabilityApi';
import {
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
  AppButton,
  AppPageHeader,
  AppEmptyState,
  AppModal,
} from '@/components/ui-system';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAppToast } from '@/hooks/useAppToast';

const DOC_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All documents' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'FINALIZED', label: 'Finalized' },
  { value: 'PAID', label: 'Paid document' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const FINANCE_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All balances' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PARTIALLY_PAID', label: 'Partially paid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIALLY_REFUNDED', label: 'Partially refunded' },
  { value: 'REFUNDED', label: 'Refunded' },
];

const MANUAL_PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHECK', label: 'Check' },
  { value: 'CARD_PRESENT', label: 'Card (manual/offline)' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'OTHER', label: 'Other' },
];

function formatCurrency(amount?: string | number | null) {
  return `$${Number(amount ?? 0).toFixed(2)}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function refundableRemaining(payment: InvoicePayment, allPayments: InvoicePayment[]) {
  const paymentAmount = Number(payment.amount);
  const refunded = allPayments
    .filter((entry) => entry.refundForPaymentId === payment.id)
    .reduce((sum, entry) => sum + Math.abs(Number(entry.amount)), 0);
  return Math.max(paymentAmount - refunded, 0);
}

export default function FrontDeskInvoicesPage() {
  const { user } = useAuth();
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const clinicId = user?.clinicId ?? undefined;
  const [docStatusFilter, setDocStatusFilter] = React.useState('ALL');
  const [financeStatusFilter, setFinanceStatusFilter] = React.useState('ALL');
  const [providerFilter, setProviderFilter] = React.useState('ALL');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [paymentInvoice, setPaymentInvoice] = React.useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState('CASH');
  const [paymentAmount, setPaymentAmount] = React.useState('');
  const [paymentNotes, setPaymentNotes] = React.useState('');
  const [refundInvoice, setRefundInvoice] = React.useState<Invoice | null>(null);
  const [refundPaymentId, setRefundPaymentId] = React.useState('');
  const [refundAmount, setRefundAmount] = React.useState('');

  const isAllowed = user?.role === 'FRONT_DESK' || user?.role === 'SUPER_ADMIN';

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['front-desk-invoices', docStatusFilter, financeStatusFilter, providerFilter, dateFrom, dateTo],
    queryFn: () =>
      getFilteredInvoices({
        status: docStatusFilter === 'ALL' ? undefined : docStatusFilter,
        financialStatus: financeStatusFilter === 'ALL' ? undefined : financeStatusFilter,
        providerId: providerFilter === 'ALL' ? undefined : providerFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    enabled: !!clinicId,
  });

  const { data: receivables } = useQuery({
    queryKey: ['receivables-summary'],
    queryFn: () => getReceivablesSummary(),
    enabled: !!clinicId,
  });

  const { data: financeSummary } = useQuery({
    queryKey: ['finance-summary', providerFilter, dateFrom, dateTo],
    queryFn: () =>
      getFinanceSummary({
        providerId: providerFilter === 'ALL' ? undefined : providerFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    enabled: !!clinicId,
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => listProviders(),
    enabled: !!clinicId,
  });

  const collectMutation = useMutation({
    mutationFn: (payload: { invoiceId: string; amount: number; paymentMethod: string; notes?: string }) =>
      recordManualInvoicePayment(payload.invoiceId, {
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        notes: payload.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['front-desk-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['receivables-summary'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      toast.success('Manual payment recorded');
      setPaymentInvoice(null);
      setPaymentAmount('');
      setPaymentNotes('');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Failed to record manual payment'),
  });

  const refundMutation = useMutation({
    mutationFn: (payload: { paymentId: string; amount?: number }) =>
      refundPayment(payload.paymentId, payload.amount ? { amount: payload.amount } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['front-desk-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['receivables-summary'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      toast.success('Refund recorded');
      setRefundInvoice(null);
      setRefundPaymentId('');
      setRefundAmount('');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Failed to refund payment'),
  });

  const eligibleRefundPayments = React.useMemo(() => {
    if (!refundInvoice?.payments) return [];
    return refundInvoice.payments.filter((payment) => {
      const amount = Number(payment.amount);
      return amount > 0 && refundableRemaining(payment, refundInvoice.payments ?? []) > 0;
    });
  }, [refundInvoice]);

  React.useEffect(() => {
    if (!refundInvoice) return;
    if (eligibleRefundPayments.length > 0 && !refundPaymentId) {
      setRefundPaymentId(eligibleRefundPayments[0].id);
    }
  }, [eligibleRefundPayments, refundInvoice, refundPaymentId]);

  if (!isAllowed) {
    return null;
  }

  if (!clinicId) {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Billing Operations" description="Front-desk billing and AR" />
        <AppEmptyState
          title="No clinic assigned"
          description="You are not assigned to a clinic. Contact your administrator."
        />
      </div>
    );
  }

  const submitManualPayment = () => {
    if (!paymentInvoice) return;
    const amount =
      paymentAmount.trim().length > 0
        ? Number(paymentAmount)
        : Number(paymentInvoice.outstandingAmount);
    collectMutation.mutate({
      invoiceId: paymentInvoice.id,
      amount,
      paymentMethod,
      notes: paymentNotes.trim() || undefined,
    });
  };

  const submitRefund = () => {
    if (!refundPaymentId) {
      toast.error('Select a payment to refund');
      return;
    }
    refundMutation.mutate({
      paymentId: refundPaymentId,
      amount: refundAmount.trim().length > 0 ? Number(refundAmount) : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Billing Operations"
        description="Outstanding balances, invoice collection, and refunds"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>Outstanding AR</AppCardTitle>
          </AppCardHeader>
          <AppCardContent>
            <div className="text-3xl font-bold text-slate-900">
              {formatCurrency(receivables?.totalOutstandingAmount)}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {receivables?.outstandingInvoiceCount ?? 0} invoices still need collection
            </p>
          </AppCardContent>
        </AppCard>
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>Partial States</AppCardTitle>
          </AppCardHeader>
          <AppCardContent className="space-y-2 text-sm text-slate-700">
            <div>Partially paid: {receivables?.partiallyPaidCount ?? 0}</div>
            <div>Partially refunded: {receivables?.partiallyRefundedCount ?? 0}</div>
            <div>Refunded: {receivables?.refundedCount ?? 0}</div>
          </AppCardContent>
        </AppCard>
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>Quick Actions</AppCardTitle>
          </AppCardHeader>
          <AppCardContent className="space-y-3">
            <AppButton asChild className="w-full">
              <Link href="/dashboard/front-desk/pos">Open front-desk checkout</Link>
            </AppButton>
            <div className="text-sm text-slate-600">
              Use checkout for new walk-in invoices. Use the table below for collection and refunds on existing invoices.
            </div>
          </AppCardContent>
        </AppCard>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>Total Invoiced</AppCardTitle>
          </AppCardHeader>
          <AppCardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(financeSummary?.totalInvoiced)}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {financeSummary?.invoiceCount ?? 0} invoices in the current filter
            </p>
          </AppCardContent>
        </AppCard>
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>Collected</AppCardTitle>
          </AppCardHeader>
          <AppCardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {formatCurrency(financeSummary?.totalCollected)}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Paid states: {financeSummary?.paidCount ?? 0} paid, {financeSummary?.partiallyPaidCount ?? 0} partial
            </p>
          </AppCardContent>
        </AppCard>
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>Refunded</AppCardTitle>
          </AppCardHeader>
          <AppCardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(financeSummary?.totalRefunded)}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {financeSummary?.partiallyRefundedCount ?? 0} partial, {financeSummary?.refundedCount ?? 0} full
            </p>
          </AppCardContent>
        </AppCard>
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>Open Balances</AppCardTitle>
          </AppCardHeader>
          <AppCardContent>
            <div className="text-2xl font-bold text-amber-700">
              {formatCurrency(financeSummary?.totalOutstanding)}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {financeSummary?.unpaidCount ?? 0} unpaid, {financeSummary?.partiallyPaidCount ?? 0} partially paid
            </p>
          </AppCardContent>
        </AppCard>
      </div>

      <AppCard>
        <AppCardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <AppCardTitle>Invoices</AppCardTitle>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All providers</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.firstName} {provider.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={docStatusFilter} onValueChange={setDocStatusFilter}>
                <SelectTrigger className="w-[190px]">
                  <SelectValue placeholder="Document status" />
                </SelectTrigger>
                <SelectContent>
                  {DOC_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={financeStatusFilter} onValueChange={setFinanceStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Financial status" />
                </SelectTrigger>
                <SelectContent>
                  {FINANCE_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
              <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
          </div>
        </AppCardHeader>
        <AppCardContent>
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <AppEmptyState
              title="No invoices found"
              description="Create a front-desk checkout or finalize appointment invoices to see them here."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/80 hover:bg-transparent">
                    <TableHead>Patient</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Appt Date</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Finance</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Refunded</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>History</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.patient?.name ?? '—'}</TableCell>
                      <TableCell>
                        {invoice.provider
                          ? `${invoice.provider.firstName} ${invoice.provider.lastName}`
                          : 'Walk-in / non-provider'}
                      </TableCell>
                      <TableCell>{formatDate(invoice.appointment?.startTime)}</TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} variant="invoice" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.financialStatus} variant="invoice" />
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.totalPaid)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.totalRefunded)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.outstandingAmount)}</TableCell>
                      <TableCell className="max-w-[280px]">
                        <div className="space-y-1 text-xs text-slate-600">
                          {(invoice.payments ?? []).length === 0 ? (
                            <span>No payments recorded</span>
                          ) : (
                            (invoice.payments ?? []).map((payment) => (
                              <div key={payment.id}>
                                {formatCurrency(payment.amount)} • {payment.paymentChannel === 'MANUAL' ? 'Manual/offline' : payment.paymentChannel ?? 'Stripe/online'}
                                {payment.paymentMethod ? ` • ${payment.paymentMethod}` : ''}
                                {payment.refundForPaymentId ? ' • refund entry' : ''}
                              </div>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {Number(invoice.outstandingAmount) > 0 && invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && (
                            <AppButton size="sm" onClick={() => setPaymentInvoice(invoice)}>
                              Collect
                            </AppButton>
                          )}
                          {(invoice.payments ?? []).some(
                            (payment) =>
                              Number(payment.amount) > 0 &&
                              refundableRemaining(payment, invoice.payments ?? []) > 0
                          ) && (
                            <AppButton size="sm" variant="outline" onClick={() => setRefundInvoice(invoice)}>
                              Refund
                            </AppButton>
                          )}
                          {invoice.status === 'DRAFT' && invoice.appointmentId && (
                            <AppButton size="sm" variant="outline" asChild>
                              <Link href={`/dashboard/provider/appointments/${invoice.appointmentId}`}>
                                Open
                              </Link>
                            </AppButton>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </AppCardContent>
      </AppCard>

      <AppModal
        open={Boolean(paymentInvoice)}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentInvoice(null);
            setPaymentAmount('');
            setPaymentNotes('');
          }
        }}
        title="Record Manual Payment"
        description={
          paymentInvoice
            ? `Outstanding balance: ${formatCurrency(paymentInvoice.outstandingAmount)}`
            : undefined
        }
        primaryAction={{
          label: collectMutation.isPending ? 'Recording...' : 'Record Payment',
          onClick: submitManualPayment,
          disabled: collectMutation.isPending,
        }}
        content={
          <div className="space-y-4">
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              placeholder="Amount (leave blank for full outstanding)"
              inputMode="decimal"
            />
            <Input
              value={paymentNotes}
              onChange={(event) => setPaymentNotes(event.target.value)}
              placeholder="Optional notes"
            />
          </div>
        }
      />

      <AppModal
        open={Boolean(refundInvoice)}
        onOpenChange={(open) => {
          if (!open) {
            setRefundInvoice(null);
            setRefundPaymentId('');
            setRefundAmount('');
          }
        }}
        title="Refund Payment"
        description="Choose a recorded payment and optionally enter a partial refund amount."
        primaryAction={{
          label: refundMutation.isPending ? 'Refunding...' : 'Refund Payment',
          onClick: submitRefund,
          disabled: refundMutation.isPending,
        }}
        content={
          <div className="space-y-4">
            <Select value={refundPaymentId} onValueChange={setRefundPaymentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment" />
              </SelectTrigger>
              <SelectContent>
                {eligibleRefundPayments.map((payment) => (
                  <SelectItem key={payment.id} value={payment.id}>
                    {formatCurrency(payment.amount)} • {payment.paymentMethod ?? payment.paymentChannel ?? 'Payment'} • refundable {formatCurrency(refundableRemaining(payment, refundInvoice?.payments ?? []))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={refundAmount}
              onChange={(event) => setRefundAmount(event.target.value)}
              placeholder="Refund amount (leave blank for full remaining refundable)"
              inputMode="decimal"
            />
            <p className="text-sm text-slate-600">
              Partial refunds are only supported on flows where proportional side-effect reversal is safe.
            </p>
          </div>
        }
      />
    </div>
  );
}
