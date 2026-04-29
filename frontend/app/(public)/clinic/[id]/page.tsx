'use client';

/**
 * Patient-facing clinic site at /clinic/[idOrSlug].
 *
 * Mirrors the Medoflow landing structure (hero / trust / value props /
 * testimonial / final CTA) but rebranded by the clinic's themeColor +
 * logoUrl. Services and providers are private and only render once a
 * patient has signed in. The avatar dropdown opens a single PatientHub
 * modal — no navigation off this domain.
 */

import React from 'react'
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { getClinic } from '@/lib/clinicApi';
import { getClinicServices } from '@/lib/serviceApi';
import { getClinicProviders } from '@/lib/providerApi';
import { getClinicLocations } from '@/lib/appointmentApi';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/components/auth/AuthModal';
import { ClinicLanding } from '@/components/clinic/ClinicLanding';
import { PatientHubModal, type PatientHubTab } from '@/components/clinic/PatientHubModal';
import {
  Building2,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  LogOut,
  Stethoscope,
  User as UserIcon,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const DEFAULT_THEME = '#0D9488';

export default function ClinicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, isAuthenticated, logout } = useAuth();
  const { openLogin } = useAuthModal();

  const [hubOpen, setHubOpen] = React.useState(false);
  const [hubTab, setHubTab] = React.useState<PatientHubTab>('overview');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  // Outside-click + escape to close avatar menu.
  React.useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const { data: clinic, isLoading: clinicLoading, error: clinicError } = useQuery({
    queryKey: ['clinic', id],
    queryFn: () => getClinic(id),
    enabled: !!id,
  });

  // Services + providers + locations are only fetched once the patient is
  // authenticated. Public site never makes those network calls.
  const enablePrivate =
    !!id && isAuthenticated && user?.role === 'PATIENT';

  const { data: services } = useQuery({
    queryKey: ['clinic-services', id],
    queryFn: () => getClinicServices(id),
    enabled: enablePrivate,
  });

  const { data: providers } = useQuery({
    queryKey: ['clinic-providers', id],
    queryFn: () => getClinicProviders(id),
    enabled: enablePrivate,
  });

  const { data: locations } = useQuery({
    queryKey: ['clinic-locations', id],
    queryFn: () => getClinicLocations(id),
    enabled: enablePrivate,
  });

  const themeColor = clinic?.themeColor?.trim() || DEFAULT_THEME;

  const primaryLocation = locations?.[0] ?? null;

  const isPatient = user?.role === 'PATIENT';

  const openHub = (initial: PatientHubTab) => {
    setHubTab(initial);
    setMenuOpen(false);
    setHubOpen(true);
  };

  const handleBook = (serviceId: string) => {
    if (!isAuthenticated || !isPatient) {
      openLogin();
      return;
    }
    router.push(`/book/${serviceId}?clinicId=${clinic?.id ?? id}`);
  };

  if (clinicError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex p-4 bg-rose-50 rounded-full text-rose-600 mb-6">
          <Building2 className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Clinic Not Found</h1>
        <p className="text-slate-500 mt-2">The clinic you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  if (clinicLoading || !clinic) {
    return (
      <div className="p-8 space-y-8 container mx-auto">
        <Skeleton className="h-[300px] w-full rounded-3xl" />
        <Skeleton className="h-[200px] w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* ─── Clinic-owned header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link
            href={`/clinic/${clinic.slug ?? id}`}
            className="flex items-center gap-3"
          >
            {clinic.logoUrl ? (
              <Image
                src={clinic.logoUrl}
                alt={`${clinic.name} logo`}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: themeColor }}
              >
                <Stethoscope className="h-5 w-5" />
              </div>
            )}
            <span className="text-base font-bold text-slate-900">{clinic.name}</span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated && isPatient ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-2 pr-3 transition-colors hover:bg-slate-50"
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white text-[13px] font-black"
                    style={{ backgroundColor: themeColor }}
                  >
                    {user?.name?.[0]?.toUpperCase() ?? 'P'}
                  </span>
                  <span className="hidden text-sm font-bold text-slate-700 sm:inline">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl"
                  >
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="truncate text-sm font-bold text-slate-900">{user?.name}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      <MenuItem
                        icon={UserIcon}
                        label="My account"
                        onClick={() => openHub('overview')}
                      />
                      <MenuItem
                        icon={CalendarCheck}
                        label="Appointments"
                        onClick={() => openHub('appointments')}
                      />
                      <MenuItem
                        icon={ClipboardList}
                        label="Visit history"
                        onClick={() => openHub('visits')}
                      />
                      <MenuItem
                        icon={UserIcon}
                        label="Profile"
                        onClick={() => openHub('profile')}
                      />
                    </div>
                    <div className="border-t border-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={openLogin}
                className="inline-flex h-10 items-center rounded-full px-5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: themeColor }}
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <ClinicLanding
        clinic={clinic}
        services={services}
        providers={providers}
        primaryLocation={primaryLocation}
        themeColor={themeColor}
        onBook={handleBook}
      />

      {/* Slim attribution footer (no Medoflow chrome). */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-slate-400 sm:flex-row lg:px-8">
          <p>
            © {new Date().getFullYear()} {clinic.name}. All rights reserved.
          </p>
          <p className="font-medium">Powered by Medoflow</p>
        </div>
      </footer>

      <PatientHubModal
        open={hubOpen}
        onOpenChange={setHubOpen}
        initialTab={hubTab}
        themeColor={themeColor}
      />
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="menuitem"
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
    >
      <Icon className="h-4 w-4 text-slate-400" />
      {label}
    </button>
  );
}
