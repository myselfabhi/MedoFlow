'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from './AppSidebar';
import { cn } from '@/lib/utils';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();

  const superAdminOnlyPrefixes = [
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

    if (isSuperAdminOnlyRoute && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
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
    <div className="min-h-screen bg-[#fafafa]">
      <AppSidebar />
      <div className="ml-[280px] relative">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
