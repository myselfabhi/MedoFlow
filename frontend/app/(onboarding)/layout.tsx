'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSkeleton } from '@/components/ui-system'

/**
 * Minimal layout for the post-signup clinic onboarding wizard.
 * - No sidebar, no topbar (the wizard shell renders its own navigation)
 * - Only SUPER_ADMIN with a clinic + !onboardingCompletedAt can stay here.
 *   PATIENTs, PROVIDERs, and already-onboarded admins are redirected.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (!user) return

    // Only SUPER_ADMIN with a clinic needs onboarding
    if (user.role !== 'SUPER_ADMIN' || !user.clinicId) {
      router.replace('/dashboard')
      return
    }

    // Already completed — nothing to do here
    if (user.clinic?.tenant?.onboardingCompletedAt) {
      router.replace('/dashboard')
      return
    }
  }, [user, isLoading, isAuthenticated, router])

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSkeleton variant="avatar" count={1} />
      </div>
    )
  }

  if (user.role !== 'SUPER_ADMIN' || !user.clinicId || user.clinic?.tenant?.onboardingCompletedAt) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {children}
    </div>
  )
}
