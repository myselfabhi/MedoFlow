'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  BookOpen,
  FileText,
  BarChart3,
  ClipboardList,
  Receipt,
} from 'lucide-react';

const patientItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/patient/appointments', label: 'My Appointments', icon: Calendar },
];

const providerItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/provider/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/appointments', label: 'Appointments', icon: ClipboardList },
  { href: '/dashboard/providers', label: 'Providers', icon: Users },
  { href: '/dashboard/disciplines', label: 'Disciplines', icon: Stethoscope },
  { href: '/dashboard/services', label: 'Services', icon: BookOpen },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

const staffAdminItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/front-desk', label: 'Front Desk', icon: ClipboardList },
  { href: '/dashboard/front-desk/invoices', label: 'Invoices', icon: Receipt },
  { href: '/dashboard/appointments', label: 'Appointments', icon: ClipboardList },
  { href: '/dashboard/providers', label: 'Providers', icon: Users },
  { href: '/dashboard/disciplines', label: 'Disciplines', icon: Stethoscope },
  { href: '/dashboard/services', label: 'Services', icon: BookOpen },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';
  const isProvider = user?.role === 'PROVIDER';
  const isStaffOrAdmin =
    user?.role === 'FRONT_DESK' || user?.role === 'SUPER_ADMIN';

  const items = isPatient
    ? patientItems
    : isProvider
      ? providerItems
      : isStaffOrAdmin
        ? staffAdminItems
        : [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r border-slate-200/80 bg-card">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-slate-200/60 px-5">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-primary"
          >
            Medoflow
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-100 text-primary'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
