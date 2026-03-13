'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyInvoices } from '@/lib/patientApi';
import {
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
  AppPageHeader,
  AppTable,
  AppButton
} from '@/components/ui-system';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageContainer } from '@/components/layout';
import { ShoppingCart, Receipt } from 'lucide-react';
import Link from 'next/link';

function formatCurrency(amount?: string | number | null) {
  return `$${Number(amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PatientBillingPage() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['my-invoices'],
    queryFn: getMyInvoices,
  });

  return (
    <PageContainer className="space-y-8">
      <AppPageHeader
        title="Billing & History"
        description="View your order history, clinic invoices, and payment status."
        actions={
          <AppButton asChild className="rounded-full px-6 shadow-md">
            <Link href="/store">
              <ShoppingCart className="mr-2 h-4 w-4" /> Go to Store
            </Link>
          </AppButton>
        }
      />

      <AppCard className="border-none shadow-sm overflow-hidden bg-white">
        <AppCardHeader className="bg-slate-50/50 border-b-0 py-6 px-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <AppCardTitle className="text-lg font-bold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary-600" />
            Transaction History
          </AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-0">
          <AppTable
            columns={[
              { 
                key: 'date', 
                header: 'Date', 
                render: (i) => (
                  <div>
                    <p className="font-bold text-slate-900">{formatDate(i.createdAt)}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">Inv: {i.id.slice(-6).toUpperCase()}</p>
                  </div>
                ) 
              },
              { 
                key: 'status', 
                header: 'Status', 
                render: (i) => (
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={i.status} variant="invoice" />
                    <StatusBadge status={i.financialStatus} variant="invoice" className="bg-transparent border-slate-100 text-[10px]" />
                  </div>
                ) 
              },
              { 
                key: 'items', 
                header: 'Items', 
                render: (i) => (
                  <div className="max-w-xs truncate">
                    <p className="text-sm text-slate-600 italic">
                      {i.items?.map((item: any) => item.description.replace('Demo Cart Item: ', '')).join(', ') || 'Consultation'}
                    </p>
                  </div>
                ) 
              },
              { 
                key: 'total', 
                header: 'Total', 
                className: 'text-right',
                render: (i) => (
                  <p className="text-sm font-black text-slate-900">{formatCurrency(i.totalAmount)}</p>
                ) 
              },
              {
                key: 'actions',
                header: '',
                className: 'text-right',
                render: (i) => (
                  <div className="flex justify-end gap-2 pr-4">
                    <AppButton variant="ghost" size="sm" className="rounded-full" asChild>
                      <Link href={`/dashboard/front-desk/invoices/${i.id}`}>View Details</Link>
                    </AppButton>
                  </div>
                )
              }
            ]}
            data={invoices}
            keyExtractor={(i) => i.id}
          />
        </AppCardContent>
      </AppCard>
    </PageContainer>
  );
}
