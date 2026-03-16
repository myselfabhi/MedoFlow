'use client';

import React from 'react';
import Link from 'next/link';
import { AppButton } from '@/components/ui-system';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, ShoppingCart } from 'lucide-react';
import { AppLogo } from '@/components/common/AppLogo';
import { useCart } from '@/hooks/useCart';

const commerceNavLinks = [
  { href: '/store', label: 'Store' },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { totalItems } = useCart();

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="sticky top-0 z-50 border-b border-transparent bg-[#fafafa]/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-12">
            <Link href="/" className="group/logo">
              <AppLogo size="lg" />
            </Link>
            <nav className="hidden lg:flex items-center gap-8">
              {commerceNavLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-slate-500 hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/#features" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                Pricing
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-6">
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
              <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2">
                Login
              </Link>
            )}

            <Link href="/checkout" className="relative p-2 text-slate-600 hover:text-primary transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </Link>
            
            <AppButton asChild size="sm" className="rounded-full px-6 bg-primary text-white hover:bg-primary-900 shadow-none font-medium h-10">
              <Link href="/#demo">
                Book a Demo
              </Link>
            </AppButton>
          </div>
        </div>
        <div className="border-t border-slate-200/70 px-4 py-2 lg:hidden">
          <nav className="flex items-center gap-2 overflow-x-auto pb-1">
            {commerceNavLinks.map((item) => (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="min-h-[calc(100vh-5rem)]">{children}</main>
      <footer className="border-t border-slate-100 bg-[#fafafa] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12">
            <div className="col-span-2 space-y-6">
              <AppLogo size="lg" />
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed font-medium">
                The operating system for modern medical clinics.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-6">Product</h4>
              <ul className="space-y-4">
                <li><Link href="/#features" className="text-sm text-slate-500 hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="/#pricing" className="text-sm text-slate-500 hover:text-primary transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-6">Built For</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Primary Care</Link></li>
                <li><Link href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Specialists</Link></li>
                <li><Link href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Mental Health</Link></li>
                <li><Link href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Med Spas</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-6">Resources</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">API Reference</Link></li>
                <li><Link href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Case Studies</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Medoflow. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-slate-500">
              <Link href="#" className="hover:text-primary">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary">Terms of Service</Link>
              <Link href="#" className="hover:text-primary">HIPAA Compliance</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
