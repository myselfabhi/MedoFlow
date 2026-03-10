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
  Mic,
} from 'lucide-react';

const patientItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/patient/appointments', label: 'Appointments', icon: Calendar },
];

const providerItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
  { href: '/dashboard/provider/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/providers', label: 'Providers', icon: Stethoscope },
  { href: '/dashboard/services', label: 'Services', icon: BookOpen },
  { href: '/dashboard/front-desk/invoices', label: 'Invoices', icon: Receipt },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/provider/calendar', label: 'AI Scribe', icon: Mic },
];

const staffAdminItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/appointments', label: 'Appointments', icon: ClipboardList },
  { href: '/dashboard/patients', label: 'Patients', icon: Users },
  { href: '/dashboard/providers', label: 'Providers', icon: Stethoscope },
  { href: '/dashboard/services', label: 'Services', icon: BookOpen },
  { href: '/dashboard/front-desk/invoices', label: 'Invoices', icon: Receipt },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/appointments', label: 'AI Scribe', icon: Mic },
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-[240px] border-r border-border bg-card">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b border-border px-5">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-foreground"
          >
            Medoflow
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-subtle',
                  isActive
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-muted-foreground hover:text-foreground'
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
