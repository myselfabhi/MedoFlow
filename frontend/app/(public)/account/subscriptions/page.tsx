'use client'

import { Ticket } from 'lucide-react'
import { AppPageHeader, AppEmptyState } from '@/components/ui-system'

export default function AccountSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Subscriptions & Packages"
        description="Active memberships, remaining sessions, and expiry details."
      />

      <AppEmptyState
        icon={<Ticket className="h-6 w-6" />}
        title="No active subscriptions"
        description="When you enroll in a clinic membership or buy a service package, the details will appear here with remaining sessions, expiry, and auto-renew controls."
        actionLabel="Browse memberships"
        onAction={() => {
          window.location.href = '/store?tab=memberships'
        }}
      />
    </div>
  )
}
