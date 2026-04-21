'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  ChevronRight,
  HelpCircle,
  LogOut,
  Menu,
  Settings,
  User as UserIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { UserAvatar } from '@/components/common/UserAvatar'
import { cn } from '@/lib/utils'

interface TopBarProps {
  onOpenMobileNav?: () => void
  onRestartTour?: () => void
}

function formatCrumb(seg: string): string {
  if (seg === 'dashboard') return 'Dashboard'
  return seg.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Dashboard-wide top bar. Replaces the old inline header strip in DashboardLayout.
 * - Left: hamburger (mobile) + breadcrumbs
 * - Right: notifications bell (UI stub), avatar dropdown
 */
export function TopBar({ onOpenMobileNav, onRestartTour }: TopBarProps) {
  const pathname = usePathname() ?? ''
  const { user, logout } = useAuth()
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

  const crumbs = React.useMemo(() => {
    const parts = pathname.split('/').filter(Boolean)
    return parts.map((seg, idx) => ({
      label: formatCrumb(seg),
      href: '/' + parts.slice(0, idx + 1).join('/'),
    }))
  }, [pathname])

  const roleLabel = user?.role?.replace('_', ' ') ?? ''

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md md:px-8">
      {/* Left: hamburger (mobile) + breadcrumbs */}
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav
        aria-label="Breadcrumb"
        className="hidden min-w-0 flex-1 items-center gap-1 text-sm text-slate-500 md:flex"
      >
        {crumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.href}>
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
            {idx === crumbs.length - 1 ? (
              <span className="truncate font-medium text-slate-900">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="truncate hover:text-slate-900">
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className="flex flex-1 md:hidden" />

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Notifications (coming soon)"
          disabled
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-left hover:bg-slate-100',
              menuOpen && 'bg-slate-100'
            )}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <UserAvatar
              seed={`${user?.id ?? ''}-${user?.name ?? ''}`}
              alt={user?.name ?? 'User'}
              className="h-7 w-7 rounded-full"
              sizes="28px"
            />
            <span className="hidden text-sm font-medium text-slate-800 md:inline">
              {user?.name?.split(' ')[0] ?? 'User'}
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg"
            >
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {roleLabel}
                </p>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onRestartTour?.()
                  }}
                  disabled={!onRestartTour}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <HelpCircle className="h-4 w-4 text-slate-400" />
                  Restart tour
                </button>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Settings
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
      </div>
    </header>
  )
}
