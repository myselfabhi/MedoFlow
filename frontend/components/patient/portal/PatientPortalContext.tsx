'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export type PatientPortalView =
  | 'booking'
  | 'appointments'
  | 'records'
  | 'billing'
  | 'profile'
  | 'settings'
  | 'help'
  | null;

interface PatientPortalContextValue {
  openView: PatientPortalView;
  open: (view: Exclude<PatientPortalView, null>) => void;
  close: () => void;
}

const PatientPortalContext = createContext<PatientPortalContextValue | undefined>(undefined);

const VALID_VIEWS: Exclude<PatientPortalView, null>[] = [
  'booking',
  'appointments',
  'records',
  'billing',
  'profile',
  'settings',
  'help',
];

export function PatientPortalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openView, setOpenView] = useState<PatientPortalView>(null);

  useEffect(() => {
    const view = searchParams.get('view');
    if (view && VALID_VIEWS.includes(view as Exclude<PatientPortalView, null>)) {
      setOpenView(view as PatientPortalView);
    }
  }, [searchParams]);

  const open = useCallback((view: Exclude<PatientPortalView, null>) => {
    setOpenView(view);
  }, []);

  const close = useCallback(() => {
    setOpenView(null);
    if (searchParams.get('view')) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('view');
      params.delete('invoice');
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
    }
  }, [router, searchParams]);

  return (
    <PatientPortalContext.Provider value={{ openView, open, close }}>
      {children}
    </PatientPortalContext.Provider>
  );
}

export function usePatientPortal() {
  const ctx = useContext(PatientPortalContext);
  if (!ctx) throw new Error('usePatientPortal must be used within PatientPortalProvider');
  return ctx;
}
