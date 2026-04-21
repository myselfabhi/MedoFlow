'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'
import { AppPageHeader, AppEmptyState } from '@/components/ui-system'

export default function AccountSummariesPage() {
  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Visit Summaries"
        description="SOAP notes, prescriptions, and medical documents from each visit."
      />

      <AppEmptyState
        icon={<FileText className="h-6 w-6" />}
        title="Visit summaries are coming soon"
        description="Your provider's post-visit notes and attached documents will appear here after each appointment. In the meantime, open any appointment to see its summary."
        actionLabel="View appointments"
        onAction={() => {
          window.location.href = '/account/appointments'
        }}
      />
    </div>
  )
}
