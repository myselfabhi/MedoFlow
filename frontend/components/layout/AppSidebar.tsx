'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  Calendar,
  CalendarPlus,
  Users,
  BarChart3,
  ClipboardList,
  Receipt,
  Video,
  MapPin,
  FileText,
  Package,
  ShoppingCart,
  Tags,
  ShieldCheck,
  LogOut,
  Stethoscope,
} from 'lucide-react'
import { AppButton } from '@/components/ui-system'
import { AppLogo } from '@/components/common/AppLogo'
import { UserAvatar } from '@/components/common/UserAvatar'

interface SidebarItem {
  href: string
  label: string
  icon: any
}

interface SidebarSection {
  title: string
  items: SidebarItem[]
}

const patientSections: SidebarSection[] = [
  {
    title: 'My Care',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/patient/appointments', label: 'Visits', icon: Calendar },
      { href: '/dashboard/patient/billing', label: 'Billing & History', icon: Receipt },
    ],
  },
  {
    title: 'Actions',
    items: [{ href: '/store', label: 'Book Appointment', icon: CalendarPlus }],
  },
  {
    title: 'Wellness',
    items: [
      { href: '/dashboard/memberships', label: 'Memberships', icon: Tags },
      { href: '/store', label: 'Clinic Store', icon: ShoppingCart },
      { href: '/store?tab=products', label: 'Products', icon: ShoppingCart },
      { href: '/store?tab=packages', label: 'Packages', icon: Package },
    ],
  },
]

const providerSections: SidebarSection[] = [
  {
    title: 'Clinical',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/provider/calendar', label: 'Schedule', icon: Calendar },
      { href: '/dashboard/appointments', label: 'Queue', icon: ClipboardList },
    ],
  },
  {
    title: 'Telehealth',
    items: [{ href: '/dashboard/provider/meetings', label: 'Video Room', icon: Video }],
  },
  {
    title: 'Insights',
    items: [{ href: '/dashboard/analytics', label: 'Performance', icon: BarChart3 }],
  },
  {
    title: 'Commerce',
    items: [
      { href: '/store', label: 'Store', icon: ShoppingCart },
      { href: '/store?tab=products', label: 'Products', icon: ShoppingCart },
      { href: '/store?tab=packages', label: 'Packages', icon: Package },
    ],
  },
]

const superAdminSections: SidebarSection[] = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard/admin', label: 'Command Center', icon: LayoutDashboard },
      { href: '/dashboard/staff', label: 'Team', icon: Users },
    ],
  },
  {
    title: 'Clinical Registry',
    items: [
      { href: '/dashboard/patients', label: 'Patients', icon: Users },
      { href: '/dashboard/appointments', label: 'Appointments', icon: ClipboardList },
    ],
  },
  {
    title: 'Catalog & Care',
    items: [
      { href: '/dashboard/services', label: 'Services', icon: ClipboardList },
      { href: '/dashboard/disciplines', label: 'Disciplines', icon: Stethoscope },
      { href: '/dashboard/forms', label: 'Forms', icon: FileText },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { href: '/dashboard/products', label: 'Storefront', icon: ShoppingCart },
      { href: '/dashboard/packages', label: 'Packages', icon: Package },
      { href: '/dashboard/memberships', label: 'Memberships', icon: Tags },
      { href: '/dashboard/commissions', label: 'Ledger', icon: Tags },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/dashboard/locations', label: 'Facility', icon: MapPin },
      { href: '/dashboard/front-desk/invoices', label: 'Invoices', icon: Receipt },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/dashboard/audit', label: 'Compliance', icon: ShieldCheck },
    ],
  },
]

const frontDeskSections: SidebarSection[] = [
  {
    title: 'Today',
    items: [
      { href: '/dashboard/front-desk', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/front-desk/pos', label: 'Checkout', icon: ShoppingCart },
    ],
  },
  {
    title: 'Clinical Ops',
    items: [
      { href: '/dashboard/appointments', label: 'Appointments', icon: ClipboardList },
      { href: '/dashboard/patients', label: 'Patients', icon: Users },
      { href: '/dashboard/forms', label: 'Intake Forms', icon: FileText },
    ],
  },
  {
    title: 'Finance',
    items: [{ href: '/dashboard/front-desk/invoices', label: 'Ledger', icon: Receipt }],
  },
  {
    title: 'Commerce',
    items: [{ href: '/store', label: 'Store', icon: ShoppingCart }],
  },
]

/**
 * Slug a nav href into a tour anchor id (e.g. /dashboard/admin -> nav-dashboard-admin).
 */
function anchorIdFor(href: string): string {
  const path = href.split('?')[0]?.replace(/^\//, '').replace(/\//g, '-') ?? ''
  return `nav-${path || 'home'}`
}

interface SidebarContentProps {
  /** when true, sidebar renders without `fixed` positioning (for use in a drawer) */
  variant?: 'fixed' | 'static'
}

export function SidebarContent({ variant = 'fixed' }: SidebarContentProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const sections =
    user?.role === 'PATIENT'
      ? patientSections
      : user?.role === 'PROVIDER'
        ? providerSections
        : user?.role === 'SUPER_ADMIN' || user?.role === 'STAFF'
          ? superAdminSections
          : user?.role === 'FRONT_DESK'
            ? frontDeskSections
            : []

  const asideClass =
    variant === 'fixed'
      ? 'fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-[#29486D] bg-[#1E3A5F] text-white'
      : 'flex h-full w-full flex-col bg-[#1E3A5F] text-white'

  return (
    <aside className={asideClass}>
      {/* Header Branding */}
      <div className="flex h-20 items-center px-8">
        <Link href="/dashboard" className="group/logo">
          <AppLogo size="lg" variant="light" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="custom-scrollbar flex-1 space-y-10 overflow-y-auto px-4 py-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-2">
            <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const itemPath = item.href.split('?')[0] ?? item.href
                const isActive =
                  pathname === itemPath ||
                  (itemPath !== '/dashboard' && pathname.startsWith(itemPath))
                const Icon = item.icon
                const tourId = anchorIdFor(item.href)
                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    data-tour-id={tourId}
                    className={cn(
                      'group relative flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition-all duration-200',
                      isActive
                        ? 'bg-white/8 font-bold text-white'
                        : 'text-white/70 hover:bg-white/6 hover:text-white'
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-white" />
                    )}
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          'h-5 w-5 transition-colors',
                          isActive ? 'text-white' : 'text-white/45 group-hover:text-white/80'
                        )}
                      />
                      {item.label}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Profile */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              seed={`${user?.id ?? ''}-${user?.name ?? ''}`}
              alt={user?.name ?? 'User'}
              className="h-10 w-10 shrink-0 rounded-xl border border-white/20"
              sizes="40px"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{user?.name}</p>
              <p className="truncate text-[10px] font-black uppercase tracking-tighter text-white/55">
                {user?.role.replace('_', ' ')}
              </p>
            </div>
          </div>
          <AppButton
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-9 w-9 rounded-xl text-white/55 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </AppButton>
        </div>
      </div>
    </aside>
  )
}

export function AppSidebar() {
  return <SidebarContent variant="fixed" />
}
