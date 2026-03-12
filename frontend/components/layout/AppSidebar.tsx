'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  ClipboardList,
  Receipt,
  Video,
  Building2,
  MapPin,
  FileText,
  Package,
  ShoppingCart,
  Tags,
  ShieldCheck,
} from 'lucide-react';

const patientItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/patient/appointments', label: 'Appointments', icon: Calendar },
  { href: '/dashboard/memberships', label: 'Memberships', icon: Tags },
];

const providerItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/provider/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/appointments', label: 'Appointments', icon: ClipboardList },
  { href: '/dashboard/provider/meetings', label: 'Meetings', icon: Video },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

const superAdminItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/clinics/new', label: 'Clinic', icon: Building2 },
  { href: '/dashboard/locations', label: 'Location', icon: MapPin },
  { href: '/dashboard/staff', label: 'Staff', icon: Users },
  { href: '/dashboard/appointments', label: 'Appointments', icon: ClipboardList },
  { href: '/dashboard/patients', label: 'Patients', icon: Users },
  { href: '/dashboard/providers', label: 'Providers', icon: Users },
  { href: '/dashboard/services', label: 'Services', icon: ClipboardList },
  { href: '/dashboard/disciplines', label: 'Disciplines', icon: ClipboardList },
  { href: '/dashboard/products', label: 'Products', icon: ShoppingCart },
  { href: '/dashboard/packages', label: 'Packages', icon: Package },
  { href: '/dashboard/memberships', label: 'Memberships', icon: Tags },
  { href: '/dashboard/forms', label: 'Forms', icon: FileText },
  { href: '/dashboard/front-desk/invoices', label: 'Invoices', icon: Receipt },
  { href: '/dashboard/commissions', label: 'Commissions', icon: Tags },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/audit', label: 'Audit Logs', icon: ShieldCheck },
];

const frontDeskItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/appointments', label: 'Appointments', icon: ClipboardList },
  { href: '/dashboard/patients', label: 'Patients', icon: Users },
  { href: '/dashboard/forms', label: 'Forms', icon: FileText },
  { href: '/dashboard/front-desk/invoices', label: 'Invoices', icon: Receipt },
  { href: '/dashboard/front-desk/pos', label: 'Checkout', icon: ShoppingCart },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';
  const isProvider = user?.role === 'PROVIDER';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isFrontDesk = user?.role === 'FRONT_DESK';

  const items = isPatient
    ? patientItems
    : isProvider
      ? providerItems
      : isSuperAdmin
        ? superAdminItems
        : isFrontDesk
          ? frontDeskItems
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
                key={`${item.href}-${item.label}`}
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
