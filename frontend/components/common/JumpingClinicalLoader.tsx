'use client'

/**
 * JumpingClinicalLoader — thin compatibility shim.
 *
 * Existing callers (app/loading.tsx, app/dashboard/loading.tsx) continue to
 * work unchanged; internally this now delegates to the unified
 * MedoflowLoader so the whole app converges on one loader primitive.
 *
 * Prefer MedoflowLoader / MedoflowFullScreen directly in new code.
 */

import React from 'react'
import { MedoflowLoader } from './MedoflowLoader'
import { cn } from '@/lib/utils'

export function JumpingClinicalLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <MedoflowLoader size="xl" tone="brand" label="Loading" />
    </div>
  )
}
