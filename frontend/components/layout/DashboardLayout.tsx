'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from './AppSidebar';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();

  const superAdminOnlyPrefixes = [
    '/dashboard/admin',
    '/dashboard/providers',
    '/dashboard/services',
    '/dashboard/disciplines',
    '/dashboard/staff',
    '/dashboard/locations',
    '/dashboard/clinic',
    '/dashboard/clinics/new',
  ];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(
        `/login?returnUrl=${encodeURIComponent(pathname || '/dashboard')}`
      );
      return;
    }

    if (isLoading || !user) return;

    if (user.role === 'SUPER_ADMIN' && !user.clinicId) {
      if (pathname !== '/dashboard/clinics/new') {
        router.replace('/dashboard/clinics/new');
      }
      return;
    }

    const isSuperAdminOnlyRoute = superAdminOnlyPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    const isFrontDeskRoute = pathname === '/dashboard/front-desk' || pathname?.startsWith('/dashboard/front-desk/');

    // SUPER_ADMIN and STAFF (custom roles) can access admin routes
    if (isSuperAdminOnlyRoute && user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF') {
      router.replace('/dashboard');
      return;
    }

    if (isFrontDeskRoute && user.role !== 'FRONT_DESK' && user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF') {
      router.replace('/dashboard');
      return;
    }
  }, [isLoading, isAuthenticated, router, pathname, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user?.role === 'SUPER_ADMIN' && !user.clinicId && pathname !== '/dashboard/clinics/new') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <AppSidebar />
      <div className="relative ml-[280px]">
        <div className="border-b border-[#E5E7EB] bg-[#FAFAFA]/95 px-8 py-5 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0D9488]">
                Dashboard
              </p>
              <p className="mt-1 text-sm text-[#64748B]">
                {user?.role === 'PATIENT' 
                  ? 'Access your health records and appointments.' 
                  : user?.role === 'PROVIDER'
                  ? 'Manage your clinical day and patient records.'
                  : 'Manage your clinic operations from one place.'}
              </p>
            </div>
          </div>
        </div>
        <main className="min-h-[calc(100vh-5rem)]">{children}</main>
      </div>
    </div>
  );
}
