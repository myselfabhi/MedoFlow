'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ProviderDashboard } from '@/components/dashboard/ProviderDashboard';
import { PatientDashboard } from '@/components/dashboard/PatientDashboard';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role === 'SUPER_ADMIN') {
      router.replace('/dashboard/admin');
      return;
    }
    if (user.role === 'FRONT_DESK') {
      router.replace('/dashboard/front-desk');
      return;
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
      </div>
    );
  }

  if (user.role === 'PROVIDER') {
    return <ProviderDashboard />;
  }

  if (user.role === 'PATIENT') {
    return <PatientDashboard />;
  }

  if (user.role === 'FRONT_DESK' || user.role === 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard Unavailable</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your account role does not have a configured dashboard yet. Please contact your clinic administrator.
      </p>
    </div>
  );
}
