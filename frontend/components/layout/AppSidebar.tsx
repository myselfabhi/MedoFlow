'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
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
} from 'lucide-react';
import { AppButton } from '@/components/ui-system';

interface SidebarItem {
  href: string;
  label: string;
  icon: any;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const patientSections: SidebarSection[] = [
  {
    title: 'My Care',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/patient/appointments', label: 'Visits', icon: Calendar },
      { href: '/dashboard/patient/billing', label: 'Billing & History', icon: Receipt },
    ]
  },
  {
    title: 'Actions',
    items: [
      { href: '/store', label: 'Book Appointment', icon: CalendarPlus },
    ]
  },
  {
    title: 'Wellness',
    items: [
      { href: '/dashboard/memberships', label: 'Memberships', icon: Tags },
      { href: '/store', label: 'Clinic Store', icon: ShoppingCart },
    ]
  }
];

const providerSections: SidebarSection[] = [
  {
    title: 'Clinical',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/provider/calendar', label: 'Schedule', icon: Calendar },
      { href: '/dashboard/appointments', label: 'Queue', icon: ClipboardList },
    ]
  },
  {
    title: 'Telehealth',
    items: [
      { href: '/dashboard/provider/meetings', label: 'Video Room', icon: Video },
    ]
  },
  {
    title: 'Insights',
    items: [
      { href: '/dashboard/analytics', label: 'Performance', icon: BarChart3 },
    ]
  }
];

const superAdminSections: SidebarSection[] = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard/admin', label: 'Command Center', icon: LayoutDashboard },
      { href: '/dashboard/staff', label: 'Team', icon: Users },
    ]
  },
  {
    title: 'Clinical Registry',
    items: [
      { href: '/dashboard/patients', label: 'Patients', icon: Users },
      { href: '/dashboard/providers', label: 'Providers', icon: Users },
      { href: '/dashboard/appointments', label: 'Appointments', icon: ClipboardList },
    ]
  },
  {
    title: 'Catalog & Care',
    items: [
      { href: '/dashboard/services', label: 'Services', icon: ClipboardList },
      { href: '/dashboard/disciplines', label: 'Disciplines', icon: Stethoscope },
      { href: '/dashboard/forms', label: 'Forms', icon: FileText },
    ]
  },
  {
    title: 'Commerce',
    items: [
      { href: '/dashboard/products', label: 'Storefront', icon: ShoppingCart },
      { href: '/dashboard/packages', label: 'Packages', icon: Package },
      { href: '/dashboard/memberships', label: 'Memberships', icon: Tags },
      { href: '/dashboard/commissions', label: 'Ledger', icon: Tags },
    ]
  },
  {
    title: 'Operations',
    items: [
      { href: '/dashboard/locations', label: 'Facility', icon: MapPin },
      { href: '/dashboard/front-desk/invoices', label: 'Invoices', icon: Receipt },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/dashboard/audit', label: 'Compliance', icon: ShieldCheck },
    ]
  }
];

const frontDeskSections: SidebarSection[] = [
  {
    title: 'Today',
    items: [
      { href: '/dashboard/front-desk', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/front-desk/pos', label: 'Checkout', icon: ShoppingCart },
    ]
  },
  {
    title: 'Clinical Ops',
    items: [
      { href: '/dashboard/appointments', label: 'Appointments', icon: ClipboardList },
      { href: '/dashboard/patients', label: 'Patients', icon: Users },
      { href: '/dashboard/forms', label: 'Intake Forms', icon: FileText },
    ]
  },
  {
    title: 'Finance',
    items: [
      { href: '/dashboard/front-desk/invoices', label: 'Ledger', icon: Receipt },
    ]
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const sections = user?.role === 'PATIENT' ? patientSections
    : user?.role === 'PROVIDER' ? providerSections
    : user?.role === 'SUPER_ADMIN' ? superAdminSections
    : user?.role === 'FRONT_DESK' ? frontDeskSections
    : [];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[280px] border-r border-slate-100 bg-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Header Branding */}
      <div className="h-20 flex items-center px-8">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-200 group-hover:scale-110 transition-transform duration-300">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900">
            Medoflow<span className="text-primary-600">.</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-10 custom-scrollbar">
        {sections.map((section) => (
          <div key={section.title} className="space-y-2">
            <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between group rounded-2xl px-4 py-3 text-sm transition-all duration-200',
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-bold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn(
                        'h-5 w-5 transition-colors',
                        isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'
                      )} />
                      {item.label}
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-in fade-in zoom-in duration-300" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 font-black text-slate-500">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate">
                {user?.role.replace('_', ' ')}
              </p>
            </div>
          </div>
          <AppButton 
            variant="ghost" 
            size="icon" 
            onClick={logout}
            className="rounded-xl h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
          </AppButton>
        </div>
      </div>
    </aside>
  );
}

