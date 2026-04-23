'use client'

/**
 * Public shell.
 *
 * Renders the marketing nav, the page content, and the marketing footer.
 * Auth gating for patient-only routes (store, book, checkout, etc.) happens
 * here so the nav and footer can stay presentational.
 */

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LoadingSkeleton } from '@/components/ui-system'
import { useAuth } from '@/contexts/AuthContext'
import { PublicNav } from '@/components/layout/PublicNav'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { AuthModalProvider } from '@/components/auth/AuthModal'
import { CartModalProvider } from '@/components/store/CartModal'
import { ProductDetailProvider } from '@/components/store/ProductDetailModal'
import { BookingModalProvider } from '@/components/booking/BookingModal'

// Routes within (public) that require authentication.
// Per PRD §8.2 logged-out users only see landing (/), clinic landing (/clinic/*),
// and login/signup. Everything below requires a patient (or higher) to be signed in.
const GATED_PREFIXES = ['/store', '/book', '/checkout', '/payment', '/intake', '/account']

function isGatedPath(pathname: string | null): boolean {
  if (!pathname) return false
  return GATED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()

  // Auth gate for patient-only routes inside the public shell.
  React.useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated && isGatedPath(pathname)) {
      const target = `/?auth=login&returnUrl=${encodeURIComponent(pathname ?? '/')}`
      router.replace(target)
    }
  }, [isLoading, isAuthenticated, pathname, router])

  const needsAuthRedirect = !isLoading && !isAuthenticated && isGatedPath(pathname)
  const isLanding = pathname === '/'

  return (
    <AuthModalProvider>
      <CartModalProvider>
        <ProductDetailProvider>
          <BookingModalProvider>
            <div className="min-h-screen bg-canvas">
              <PublicNav />
              {/* Landing page bleeds into the nav (transparent hero); interior pages
                need top padding since the nav is fixed. */}
              <main className={isLanding ? '' : 'pt-16 md:pt-18'}>
                {needsAuthRedirect ? (
                  <div className="mx-auto max-w-md px-4 py-20">
                    <LoadingSkeleton variant="card" />
                  </div>
                ) : (
                  children
                )}
              </main>
              <PublicFooter />
            </div>
          </BookingModalProvider>
        </ProductDetailProvider>
      </CartModalProvider>
    </AuthModalProvider>
  )
}
