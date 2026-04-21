'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AppButton, LoadingSkeleton } from '@/components/ui-system'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  LogOut,
  ShoppingCart,
  User as UserIcon,
  CalendarCheck,
  Receipt,
} from 'lucide-react'
import { AppLogo } from '@/components/common/AppLogo'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useCart } from '@/hooks/useCart'

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
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { totalItems } = useCart()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // Auth gate for patient-only routes inside the public shell
  React.useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated && isGatedPath(pathname)) {
      const target = `/login?returnUrl=${encodeURIComponent(pathname ?? '/')}`
      router.replace(target)
    }
  }, [isLoading, isAuthenticated, pathname, router])

  const isPatient = user?.role === 'PATIENT'
  const needsAuthRedirect = !isLoading && !isAuthenticated && isGatedPath(pathname)

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="sticky top-0 z-50 border-b border-transparent bg-[#fafafa]/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-12">
            <Link href="/" className="group/logo">
              <AppLogo size="lg" />
            </Link>
            <nav className="hidden lg:flex items-center gap-8">
              {isAuthenticated && isPatient && (
                <Link
                  href="/store"
                  className="text-sm font-medium text-slate-500 hover:text-primary transition-colors"
                >
                  Store
                </Link>
              )}
              {!isAuthenticated && (
                <>
                  <Link
                    href="/#features"
                    className="text-sm font-medium text-slate-500 hover:text-primary transition-colors"
                  >
                    Features
                  </Link>
                  <Link
                    href="/#pricing"
                    className="text-sm font-medium text-slate-500 hover:text-primary transition-colors"
                  >
                    Pricing
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            {!isLoading && isAuthenticated ? (
              isPatient ? (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-left hover:bg-slate-100"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <UserAvatar
                      seed={`${user?.id ?? ''}-${user?.name ?? ''}`}
                      alt={user?.name ?? 'User'}
                      className="h-8 w-8 rounded-full"
                      sizes="32px"
                    />
                    <span className="hidden text-sm font-medium text-slate-800 sm:inline">
                      {user?.name?.split(' ')[0] ?? 'Account'}
                    </span>
                  </button>
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg"
                    >
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {user?.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/account"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <LayoutDashboard className="h-4 w-4 text-slate-400" />
                          My Account
                        </Link>
                        <Link
                          href="/account/appointments"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <CalendarCheck className="h-4 w-4 text-slate-400" />
                          Appointments
                        </Link>
                        <Link
                          href="/account/billing"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Receipt className="h-4 w-4 text-slate-400" />
                          Billing
                        </Link>
                        <Link
                          href="/account/profile"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <UserIcon className="h-4 w-4 text-slate-400" />
                          Profile
                        </Link>
                      </div>
                      <div className="border-t border-slate-100 py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false)
                            logout()
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="hidden sm:inline text-sm font-medium text-slate-500">
                    Welcome, <span className="text-slate-900">{user?.name.split(' ')[0]}</span>
                  </span>
                  <AppButton
                    asChild
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-slate-600"
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                    </Link>
                  </AppButton>
                </div>
              )
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2"
                >
                  Login
                </Link>
                <AppButton
                  asChild
                  size="sm"
                  variant="outline"
                  className="rounded-full px-5 font-medium h-9"
                >
                  <Link href="/signup">Sign up</Link>
                </AppButton>
              </div>
            )}

            {isAuthenticated && isPatient && (
              <Link
                href="/checkout"
                className="relative p-2 text-slate-600 hover:text-primary transition-colors"
              >
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {!isAuthenticated && (
              <AppButton
                asChild
                size="sm"
                className="rounded-full px-6 bg-primary text-white hover:bg-primary-900 shadow-none font-medium h-10"
              >
                <Link href="/#demo">Book a Demo</Link>
              </AppButton>
            )}
          </div>
        </div>
        <div className="border-t border-slate-200/70 px-4 py-2 lg:hidden">
          <nav className="flex items-center gap-2 overflow-x-auto pb-1">
            {isAuthenticated && isPatient && (
              <Link
                href="/store"
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                Store
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="min-h-[calc(100vh-5rem)]">
        {needsAuthRedirect ? (
          <div className="mx-auto max-w-md px-4 py-20">
            <LoadingSkeleton variant="card" />
          </div>
        ) : (
          children
        )}
      </main>
      <footer className="border-t border-slate-100 bg-[#fafafa] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12">
            <div className="col-span-2 space-y-6">
              <AppLogo size="lg" />
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed font-medium">
                The operating system for modern medical clinics.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-6">Product</h4>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="/#features"
                    className="text-sm text-slate-500 hover:text-primary transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#pricing"
                    className="text-sm text-slate-500 hover:text-primary transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-6">Built For</h4>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-500 hover:text-primary transition-colors"
                  >
                    Primary Care
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-500 hover:text-primary transition-colors"
                  >
                    Specialists
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-500 hover:text-primary transition-colors"
                  >
                    Mental Health
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-500 hover:text-primary transition-colors"
                  >
                    Med Spas
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-6">Resources</h4>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-500 hover:text-primary transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-500 hover:text-primary transition-colors"
                  >
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-500 hover:text-primary transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-500 hover:text-primary transition-colors"
                  >
                    Case Studies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Medoflow. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-500">
              <Link href="#" className="hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-primary">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-primary">
                HIPAA Compliance
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
