'use client'

import * as React from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppButton } from './AppButton'

export interface AppErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  secondary?: React.ReactNode
  className?: string
}

/**
 * Full-card error display for failed data loads or caught exceptions.
 * Pair with <DashboardErrorBoundary/> or render from a query's error branch.
 */
export function AppErrorState({
  title = 'Something went wrong',
  description = 'We couldn\u2019t load this section. Please try again in a moment.',
  onRetry,
  retryLabel = 'Try again',
  secondary,
  className,
}: AppErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'rounded-2xl border border-dashed border-rose-200 bg-rose-50/40 px-6 py-12',
        className
      )}
      role="alert"
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <AlertCircle className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-600">{description}</p>
      {(onRetry || secondary) && (
        <div className="mt-5 flex items-center gap-3">
          {onRetry && (
            <AppButton variant="primary" onClick={onRetry}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {retryLabel}
            </AppButton>
          )}
          {secondary}
        </div>
      )}
    </div>
  )
}
