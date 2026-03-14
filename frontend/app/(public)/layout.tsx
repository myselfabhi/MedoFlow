'use client';

import Link from 'next/link';
import { AppButton } from '@/components/ui-system';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, LayoutDashboard, LogIn } from 'lucide-react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold tracking-tight text-primary-600">
              Medoflow
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/#services" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">
                Services
              </Link>
              <Link href="/#providers" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">
                Providers
              </Link>
              <Link href="/store" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">
                Store
              </Link>
              <Link href="/store?tab=memberships" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">
                Memberships
              </Link>
              <Link href="/store?tab=packages" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">
                Packages
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline text-sm font-medium text-slate-500">
                  Welcome, <span className="text-slate-900">{user?.name.split(' ')[0]}</span>
                </span>
                <AppButton asChild variant="ghost" size="sm" className="rounded-full text-slate-600">
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                  </Link>
                </AppButton>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 flex items-center gap-2">
                <LogIn className="h-4 w-4" /> Login
              </Link>
            )}
            
            <AppButton asChild size="sm" className="rounded-full px-5">
              <Link href="/store">
                Book Appointment
              </Link>
            </AppButton>
          </div>
        </div>
      </header>
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      <footer className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <span className="text-xl font-bold text-primary-600">Medoflow</span>
              <p className="mt-4 text-sm text-slate-500 max-w-xs">
                Premium healthcare operating system for self-pay clinics. Providing better care through better operations.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Clinic</h4>
              <ul className="mt-4 space-y-2">
                <li><Link href="/#services" className="text-sm text-slate-500 hover:text-primary-600">Services</Link></li>
                <li><Link href="/#providers" className="text-sm text-slate-500 hover:text-primary-600">Providers</Link></li>
                <li><Link href="/#locations" className="text-sm text-slate-500 hover:text-primary-600">Locations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Commerce</h4>
              <ul className="mt-4 space-y-2">
                <li><Link href="/store" className="text-sm text-slate-500 hover:text-primary-600">Shop Products</Link></li>
                <li><Link href="/store?tab=memberships" className="text-sm text-slate-500 hover:text-primary-600">Memberships</Link></li>
                <li><Link href="/store?tab=packages" className="text-sm text-slate-500 hover:text-primary-600">Wellness Packages</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} Medoflow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

