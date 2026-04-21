'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, Receipt } from 'lucide-react'
import { getMyInvoices } from '@/lib/patientApi'
import {
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
  AppPageHeader,
  AppTable,
  AppButton,
  LoadingSkeleton,
  AppErrorState,
} from '@/components/ui-system'
import { StatusBadge } from '@/components/common/StatusBadge'

function formatCurrency(amount?: string | number | null) {
  return `$${Number(amount ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AccountBillingPage() {
  const {
    data: invoices = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-invoices'],
    queryFn: getMyInvoices,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Billing & payments" description="Invoices and payment status" />
        <LoadingSkeleton variant="table" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Billing & payments" description="Invoices and payment status" />
        <AppErrorState
          title="Could not load your invoices"
          description="Try again in a moment."
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Billing & payments"
        description="Invoices, receipts, and payment status"
        actions={
          <AppButton asChild className="rounded-full px-6 shadow-sm">
            <Link href="/store">
              <ShoppingCart className="mr-2 h-4 w-4" /> Store
            </Link>
          </AppButton>
        }
      />

      <AppCard className="border border-slate-100 shadow-sm overflow-hidden bg-white">
        <AppCardHeader className="bg-slate-50/60 border-b border-slate-100 py-5 px-6">
          <AppCardTitle className="text-base font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-indigo-600" />
            Transaction history
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
                    <p className="font-semibold text-slate-900">{formatDate(i.createdAt)}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                      Inv: {i.id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (i) => (
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={i.status} variant="invoice" />
                    <StatusBadge
                      status={i.financialStatus}
                      variant="invoice"
                      className="bg-transparent border-slate-100 text-[10px]"
                    />
                  </div>
                ),
              },
              {
                key: 'items',
                header: 'Items',
                render: (i) => (
                  <div className="max-w-xs truncate">
                    <p className="text-sm text-slate-600">
                      {i.items
                        ?.map((item: any) => item.description?.replace('Demo Cart Item: ', ''))
                        .join(', ') || 'Consultation'}
                    </p>
                  </div>
                ),
              },
              {
                key: 'total',
                header: 'Total',
                className: 'text-right',
                render: (i) => (
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(i.totalAmount)}
                  </p>
                ),
              },
            ]}
            data={invoices}
            keyExtractor={(i) => i.id}
            emptyTitle="No invoices yet"
            emptyDescription="Your paid orders and visits will appear here."
          />
        </AppCardContent>
      </AppCard>
    </div>
  )
}
