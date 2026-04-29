'use client'

/**
 * ClinicHeader — branded sticky header for the clinic-owned site.
 *
 * Used on `/clinic/[id]` and `/clinic/[id]/store`. Shows the clinic logo
 * + name on the left and either an avatar dropdown (logged-in patient)
 * or a "Sign in" button (logged-out / non-patient) on the right.
 *
 * Hub tab clicks bubble up via `onOpenHub` so the parent page owns the
 * PatientHubModal lifecycle.
 */

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  LogOut,
  ShoppingBag,
  ShoppingCart,
  Stethoscope,
  User as UserIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/components/auth/AuthModal'
import { useCart } from '@/hooks/useCart'
import { useCartModal } from '@/components/store/CartModal'
import { useRouter, usePathname } from 'next/navigation'
import type { PatientHubTab } from './PatientHubModal'

interface ClinicLite {
  id: string
  slug?: string | null
  name: string
  logoUrl?: string | null
}

interface Props {
  clinic: ClinicLite
  themeColor: string
  /** Path segment used in /clinic/[id]/... links — slug if available, else cuid. */
  routeId: string
  onOpenHub?: (tab: PatientHubTab) => void
}

export function ClinicHeader({ clinic, themeColor, routeId, onOpenHub }: Props) {
  const { user, isAuthenticated, logout } = useAuth()
  const { openLogin } = useAuthModal()
  const cartModal = useCartModal()
  const { totalItems } = useCart()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement | null>(null)

  const isOnStore = pathname?.startsWith(`/clinic/${routeId}/store`)
  const belongsHere = user?.role === 'PATIENT' && user?.clinicId === clinic.id

  React.useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const isPatient = user?.role === 'PATIENT'

  const goToShop = () => {
    setMenuOpen(false)
    router.push(`/clinic/${routeId}/store`)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href={`/clinic/${routeId}`} className="flex items-center gap-3">
          {clinic.logoUrl ? (
            <Image
              src={clinic.logoUrl}
              alt={`${clinic.name} logo`}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: themeColor }}
            >
              <Stethoscope className="h-5 w-5" />
            </div>
          )}
          <span className="text-base font-bold text-slate-900">{clinic.name}</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Store + Cart — only for patients of THIS clinic. Cart is
              "always visible" once they're authenticated and belonging,
              so a single tap reveals their basket from any clinic page. */}
          {isAuthenticated && belongsHere && (
            <>
              <Link
                href={`/clinic/${routeId}/store`}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full px-3 sm:px-4 text-sm font-bold transition-colors ${
                  isOnStore ? 'text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
                style={isOnStore ? { backgroundColor: themeColor } : undefined}
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Store</span>
              </Link>
              <button
                type="button"
                onClick={() => cartModal.open({ themeColor, routeId })}
                aria-label={`Open cart${totalItems ? ` — ${totalItems} item${totalItems === 1 ? '' : 's'}` : ''}`}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black text-white shadow-sm"
                    style={{ backgroundColor: themeColor }}
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
            </>
          )}

          {isAuthenticated && isPatient ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-2 pr-3 transition-colors hover:bg-slate-50"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white text-[13px] font-black"
                  style={{ backgroundColor: themeColor }}
                >
                  {user?.name?.[0]?.toUpperCase() ?? 'P'}
                </span>
                <span className="hidden text-sm font-bold text-slate-700 sm:inline">
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl"
                >
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-bold text-slate-900">{user?.name}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <MenuItem
                      icon={UserIcon}
                      label="My account"
                      onClick={() => {
                        setMenuOpen(false)
                        onOpenHub?.('overview')
                      }}
                    />
                    <MenuItem
                      icon={CalendarCheck}
                      label="Appointments"
                      onClick={() => {
                        setMenuOpen(false)
                        onOpenHub?.('appointments')
                      }}
                    />
                    <MenuItem
                      icon={ShoppingBag}
                      label="Shop"
                      onClick={goToShop}
                    />
                    <MenuItem
                      icon={ClipboardList}
                      label="Visit history"
                      onClick={() => {
                        setMenuOpen(false)
                        onOpenHub?.('visits')
                      }}
                    />
                    <MenuItem
                      icon={UserIcon}
                      label="Profile"
                      onClick={() => {
                        setMenuOpen(false)
                        onOpenHub?.('profile')
                      }}
                    />
                  </div>
                  <div className="border-t border-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        logout()
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openLogin}
              className="inline-flex h-10 items-center rounded-full px-5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="menuitem"
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
    >
      <Icon className="h-4 w-4 text-slate-400" />
      {label}
    </button>
  )
}
