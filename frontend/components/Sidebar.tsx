'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const patientItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/patient/appointments', label: 'My Appointments' },
];

const providerItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/provider/calendar', label: 'Calendar' },
  { href: '/dashboard/appointments', label: 'Appointments' },
  { href: '/dashboard/providers', label: 'Providers' },
  { href: '/dashboard/disciplines', label: 'Disciplines' },
  { href: '/dashboard/services', label: 'Services' },
  { href: '/dashboard/analytics', label: 'Analytics' },
];

const staffAdminItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/front-desk', label: 'Front Desk' },
  { href: '/dashboard/front-desk/invoices', label: 'Invoices' },
  { href: '/dashboard/appointments', label: 'Appointments' },
  { href: '/dashboard/providers', label: 'Providers' },
  { href: '/dashboard/disciplines', label: 'Disciplines' },
  { href: '/dashboard/services', label: 'Services' },
  { href: '/dashboard/analytics', label: 'Analytics' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';
  const isProvider = user?.role === 'PROVIDER';
  const isStaffOrAdmin =
    user?.role === 'STAFF' ||
    user?.role === 'CLINIC_ADMIN' ||
    user?.role === 'SUPER_ADMIN';

  const items = isPatient
    ? patientItems
    : isProvider
      ? providerItems
      : isStaffOrAdmin
        ? staffAdminItems
        : [{ href: '/dashboard', label: 'Dashboard' }];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <Link href="/dashboard" className="text-xl font-semibold text-primary-600">
            Medoflow
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm font-medium',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
