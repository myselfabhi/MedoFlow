'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AppSidebar } from './AppSidebar'
import { AppSidebarMobile } from './AppSidebarMobile'
import { TopBar } from './TopBar'
import { DashboardErrorBoundary, LoadingSkeleton } from '@/components/ui-system'
import { useTour } from '@/contexts/TourContext'

export interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, user } = useAuth()
  const { start: startTour } = useTour()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const superAdminOnlyPrefixes = [
    '/dashboard/admin',
    '/dashboard/providers',
    '/dashboard/services',
    '/dashboard/disciplines',
    '/dashboard/staff',
    '/dashboard/locations',
    '/dashboard/clinic',
  ]

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent(pathname || '/dashboard')}`)
      return
    }

    if (isLoading || !user) return

    // PATIENT role is no longer allowed in /dashboard (Phase 2: kill /dashboard/patient/*)
    if (user.role === 'PATIENT') {
      router.replace('/account')
      return
    }

    // First-time SUPER_ADMIN setup — route to onboarding wizard
    const onboardingCompletedAt = user.clinic?.tenant?.onboardingCompletedAt
    if (
      user.role === 'SUPER_ADMIN' &&
      user.clinicId &&
      !onboardingCompletedAt &&
      pathname !== '/welcome' &&
      !pathname?.startsWith('/welcome')
    ) {
      router.replace('/welcome')
      return
    }

    // SUPER_ADMIN without a clinic shouldn't exist post-signup anymore, but if
    // we land in that state, route to signup instead of the removed /clinics/new page.
    if (user.role === 'SUPER_ADMIN' && !user.clinicId) {
      router.replace('/signup')
      return
    }

    const isSuperAdminOnlyRoute = superAdminOnlyPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )

    const isFrontDeskRoute =
      pathname === '/dashboard/front-desk' || pathname?.startsWith('/dashboard/front-desk/')

    // SUPER_ADMIN and STAFF (custom roles) can access admin routes
    if (isSuperAdminOnlyRoute && user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF') {
      router.replace('/dashboard')
      return
    }

    if (
      isFrontDeskRoute &&
      user.role !== 'FRONT_DESK' &&
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'STAFF'
    ) {
      router.replace('/dashboard')
      return
    }
  }, [isLoading, isAuthenticated, router, pathname, user])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSkeleton variant="avatar" count={1} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Block rendering during the SUPER_ADMIN onboarding redirect
  if (
    user?.role === 'SUPER_ADMIN' &&
    user.clinicId &&
    !user.clinic?.tenant?.onboardingCompletedAt &&
    pathname !== '/welcome' &&
    !pathname?.startsWith('/welcome')
  ) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Desktop fixed sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile drawer */}
      <AppSidebarMobile open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      <div className="relative md:ml-[280px]">
        <TopBar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onRestartTour={() => startTour({ force: true })}
        />
        <main className="min-h-[calc(100vh-3.5rem)]">
          <DashboardErrorBoundary>{children}</DashboardErrorBoundary>
        </main>
      </div>
    </div>
  )
}
