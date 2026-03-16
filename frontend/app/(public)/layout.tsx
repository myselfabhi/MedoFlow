'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppButton } from '@/components/ui-system';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import { AppLogo } from '@/components/common/AppLogo';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Scroll-aware header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-[0_1px_3px_rgb(0,0,0,0.04)]' : 'bg-transparent border-b border-transparent'}`}>
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-12">
            <Link href="/" className="group/logo">
              <AppLogo size="md" />
            </Link>
            <nav className="hidden lg:flex items-center gap-8">
              {[
                { href: '/#features', label: 'Features' },
                { href: '/#pricing', label: 'Pricing' },
                { href: '/#demo', label: 'Demo' },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors relative group">
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 ai-gradient-bg rounded-full group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {!isLoading && isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-4">
                <span className="text-sm font-medium text-slate-500">
                  Welcome, <span className="text-slate-900">{user?.name.split(' ')[0]}</span>
                </span>
                <AppButton asChild variant="ghost" size="sm" className="rounded-full text-slate-600">
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                  </Link>
                </AppButton>
              </div>
            ) : (
              <Link href="/login" className="hidden sm:inline-flex text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                Login
              </Link>
            )}

            <AppButton asChild size="sm" className="hidden sm:inline-flex rounded-full px-6 ai-gradient-bg text-white hover:opacity-90 shadow-glow font-semibold h-10 transition-all duration-300">
              <Link href="/#demo">
                Book a Demo
              </Link>
            </AppButton>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="lg:hidden overflow-hidden bg-white border-t border-slate-100"
            >
              <div className="px-4 py-6 space-y-4">
                {[
                  { href: '/#features', label: 'Features' },
                  { href: '/#pricing', label: 'Pricing' },
                  { href: '/#demo', label: 'Demo' },
                ].map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block text-base font-medium text-slate-700 hover:text-slate-900 py-2">
                    {link.label}
                  </Link>
                ))}
                <hr className="border-slate-100" />
                {!isLoading && isAuthenticated ? (
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block text-base font-medium text-slate-700 py-2">
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="block text-base font-medium text-slate-700 py-2">
                    Login
                  </Link>
                )}
                <AppButton asChild size="lg" className="w-full rounded-full ai-gradient-bg text-white font-semibold">
                  <Link href="/#demo" onClick={() => setMobileOpen(false)}>
                    Book a Demo
                  </Link>
                </AppButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>{children}</main>

      {/* Dark navy footer */}
      <footer className="bg-[#1a3250] text-white pt-20 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12">
            <div className="col-span-2 space-y-6">
              <AppLogo size="lg" variant="light" />
              <p className="text-sm text-white/50 max-w-xs leading-relaxed">
                The AI-powered operating system for modern medical clinics.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-6">Product</h4>
              <ul className="space-y-4">
                <li><Link href="/#features" className="text-sm text-white/50 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/#pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/#demo" className="text-sm text-white/50 hover:text-white transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-6">Built For</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Primary Care</Link></li>
                <li><Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Specialists</Link></li>
                <li><Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Mental Health</Link></li>
                <li><Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Med Spas</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-6">Resources</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Case Studies</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/40">&copy; {new Date().getFullYear()} Medoflow. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-white/40">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-white transition-colors">HIPAA Compliance</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
