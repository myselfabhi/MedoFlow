'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppButton } from '@/components/ui-system';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, LayoutDashboard, LogIn, ChevronDown, ShoppingBag, Tags, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/common/AppLogo';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [storeOpen, setStoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-10">
            <Link href="/">
              <AppLogo size="md" />
            </Link>
            <nav className="hidden lg:flex items-center gap-8">
              <Link href="/#services" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">
                Services
              </Link>
              <Link href="/#providers" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">
                Providers
              </Link>
              
              {/* Refined Store Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => setStoreOpen(true)}
                onMouseLeave={() => setStoreOpen(false)}
              >
                <Link 
                  href="/store" 
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium transition-colors",
                    storeOpen ? "text-primary-600" : "text-slate-600 hover:text-primary-600"
                  )}
                >
                  Store <ChevronDown className={cn("h-4 w-4 transition-transform", storeOpen && "rotate-180")} />
                </Link>
                
                {storeOpen && (
                  <div className="absolute top-full -left-4 w-64 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 overflow-hidden">
                      <Link 
                        href="/store?tab=products" 
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group/item"
                        onClick={() => setStoreOpen(false)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 group-hover/item:bg-primary-600 group-hover/item:text-white transition-colors">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Products</p>
                          <p className="text-xs text-slate-500">Clinical supplements</p>
                        </div>
                      </Link>
                      
                      <Link 
                        href="/store?tab=memberships" 
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group/item"
                        onClick={() => setStoreOpen(false)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-colors">
                          <Tags className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Memberships</p>
                          <p className="text-xs text-slate-500">Recurring care plans</p>
                        </div>
                      </Link>
                      
                      <Link 
                        href="/store?tab=packages" 
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group/item"
                        onClick={() => setStoreOpen(false)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover/item:bg-amber-600 group-hover/item:text-white transition-colors">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Wellness Packages</p>
                          <p className="text-xs text-slate-500">Prepaid session bundles</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
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
            
            <AppButton asChild size="sm" className="rounded-full px-5 shadow-lg shadow-primary-100">
              <Link href="/#services">
                Book Appointment
              </Link>
            </AppButton>
          </div>
        </div>
      </header>
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      <footer className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="col-span-2 space-y-6">
              <AppLogo size="lg" />
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed font-medium">
                The premium healthcare operating system for US self-pay clinics. Providing better care through better operations.
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

