'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getClinics } from '@/lib/clinicApi';
import type { Clinic } from '@/lib/types/booking';

const STORAGE_KEY = 'medoflow_selected_clinic_id';

interface ClinicContextType {
  selectedClinicId: string | null;
  setSelectedClinicId: (id: string | null) => void;
  clinics: Clinic[];
  isLoading: boolean;
  refetchClinics: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedClinicId, setSelectedClinicIdState] = useState<string | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const setSelectedClinicId = useCallback((id: string | null) => {
    setSelectedClinicIdState(id);
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refetchClinics = useCallback(async () => {
    if (user?.role !== 'SUPER_ADMIN') return;
    setIsLoading(true);
    try {
      const list = await getClinics();
      setClinics(list);
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') return;
    refetchClinics();
  }, [user?.role, refetchClinics]);

  // Restore selected clinic from localStorage immediately so pages like Providers
  // have clinicId before clinics finish loading
  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') return;
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      setSelectedClinicIdState(stored);
    }
  }, [user?.role]);

  // Sync with clinics when they load: validate stored, or pick first if none stored
  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN' || clinics.length === 0) return;
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored && !clinics.some((c) => c.id === stored)) {
      setSelectedClinicIdState(clinics[0].id);
    } else if (!stored) {
      setSelectedClinicIdState(clinics[0].id);
    }
  }, [user?.role, clinics]);

  const value: ClinicContextType = {
    selectedClinicId,
    setSelectedClinicId,
    clinics,
    isLoading,
    refetchClinics,
  };

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}

export function useSelectedClinicId(): string | null {
  const { user } = useAuth();
  const context = useContext(ClinicContext);
  if (user?.role === 'SUPER_ADMIN' && context) {
    return context.selectedClinicId;
  }
  return user?.clinicId ?? null;
}
