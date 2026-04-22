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
import { StatusBadge } from '@/components/common/StatusBadge';
import { getMyInvoices } from '@/lib/patientApi';
import { Receipt, Calendar, DollarSign, CreditCard } from 'lucide-react';

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

function formatMoney(value: string | number) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return `$${n.toFixed(2)}`;
}

export function BillingModal({ open, onOpenChange }: Props) {
  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ['patient-invoices'],
    queryFn: () => getMyInvoices(),
    enabled: open,
  });

  const totalPaid = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((s, i) => s + parseFloat(i.totalAmount ?? '0'), 0);
  const totalDue = invoices
    .filter((i) => ['PENDING_PAYMENT', 'UNPAID', 'PARTIALLY_PAID'].includes(i.status))
    .reduce((s, i) => s + parseFloat(i.totalAmount ?? '0'), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl border-slate-100 bg-white p-0 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="relative bg-gradient-to-br from-primary via-primary-700 to-primary-900 p-6 text-white">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Billing & Invoices</DialogTitle>
                <DialogDescription className="text-sm text-white/75">
                  Your payment history and open balances
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="relative mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Total paid</p>
              <p className="mt-1 text-xl font-black text-white">{formatMoney(totalPaid)}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Outstanding</p>
              <p className="mt-1 text-xl font-black text-white">{formatMoney(totalDue)}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <AppEmptyState
              title="No invoices yet"
              description="Your clinic receipts and invoices will show here."
              icon={<Receipt className="h-6 w-6" />}
            />
          ) : (
            <ul className="space-y-3">
              {invoices.map((inv: any) => (
                <li
                  key={inv.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          Invoice #{inv.id.slice(-6).toUpperCase()}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(inv.createdAt ?? inv.issuedAt)}
                          </span>
                          {inv.paymentMethod && (
                            <span className="inline-flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {inv.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">
                        {formatMoney(inv.totalAmount ?? '0')}
                      </p>
                      <StatusBadge status={inv.status} variant="invoice" className="mt-1" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
