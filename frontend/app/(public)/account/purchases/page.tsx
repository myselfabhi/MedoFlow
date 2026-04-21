'use client'

import { ShoppingBag } from 'lucide-react'
import { AppPageHeader, AppEmptyState } from '@/components/ui-system'

export default function AccountPurchasesPage() {
  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Purchases"
        description="Your product order history from the clinic store."
      />

      <AppEmptyState
        icon={<ShoppingBag className="h-6 w-6" />}
        title="Your purchases will appear here"
        description="After you check out from the store, every order will show up here with details, tracking, and re-order shortcuts."
        actionLabel="Visit the store"
        onAction={() => {
          window.location.href = '/store'
        }}
      />
    </div>
  )
}
