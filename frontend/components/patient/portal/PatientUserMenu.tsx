'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  CalendarClock,
  FileHeart,
  Receipt,
  UserCircle2,
  Settings,
  LifeBuoy,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/common/UserAvatar';
import { cn } from '@/lib/utils';
import { usePatientPortal, type PatientPortalView } from './PatientPortalContext';

interface MenuItem {
  id: Exclude<PatientPortalView, null>;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'appointments',
    label: 'My Appointments',
    description: 'Upcoming & past visits',
    icon: CalendarClock,
    accent: true,
  },
  {
    id: 'records',
    label: 'Health Records',
    description: 'Prescriptions & visit notes',
    icon: FileHeart,
  },
  {
    id: 'billing',
    label: 'Billing & Invoices',
    description: 'Receipts and payments',
    icon: Receipt,
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Your personal details',
    icon: UserCircle2,
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Notifications & privacy',
    icon: Settings,
  },
  {
    id: 'help',
    label: 'Help & Support',
    description: 'Talk to our care team',
    icon: LifeBuoy,
  },
];

export function PatientUserMenu() {
  const { user, logout } = useAuth();
  const { open } = usePatientPortal();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!user) return null;

  const firstName = user.name.split(' ')[0];

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className={cn(
          'group flex items-center gap-3 rounded-full border border-slate-200/60 bg-white/70 py-1.5 pl-1.5 pr-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition-all duration-200',
          'hover:border-primary/30 hover:bg-white hover:shadow-card',
          isOpen && 'border-primary/40 bg-white shadow-card ring-2 ring-primary/15'
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <UserAvatar
          seed={`${user.id}-${user.name}`}
          alt={user.name}
          className="h-8 w-8 shrink-0 ring-2 ring-white"
          sizes="32px"
        />
        <span className="hidden sm:inline text-slate-800">Hi, {firstName}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-400 transition-transform duration-200',
            isOpen && 'rotate-180 text-primary'
          )}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-full z-50 mt-3 w-[340px] origin-top-right overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200'
          )}
        >
          {/* Gradient header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-700 to-accent-700 p-5 text-white">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-accent/30 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <UserAvatar
                seed={`${user.id}-${user.name}`}
                alt={user.name}
                className="h-12 w-12 shrink-0 ring-2 ring-white/40"
                sizes="48px"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-bold">{user.name}</p>
                <p className="truncate text-xs text-white/70">{user.email}</p>
              </div>
            </div>
            <div className="relative mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              Patient Portal
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    open(item.id);
                  }}
                  className={cn(
                    'group/item flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
                    'hover:bg-primary-50/60'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all',
                      item.accent
                        ? 'bg-accent/10 text-accent-700 group-hover/item:bg-accent group-hover/item:text-white'
                        : 'bg-slate-100 text-slate-600 group-hover/item:bg-primary group-hover/item:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="truncate text-xs text-slate-500">{item.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Logout */}
          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <LogOut className="h-4 w-4" />
              </div>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
