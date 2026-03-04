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
    if (user.role === 'STAFF' || user.role === 'CLINIC_ADMIN' || user.role === 'SUPER_ADMIN') {
      router.replace('/dashboard/front-desk');
      return;
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (user.role === 'PROVIDER') {
    return <ProviderDashboard />;
  }

  if (user.role === 'PATIENT') {
    return <PatientDashboard />;
  }

  if (user.role === 'STAFF' || user.role === 'CLINIC_ADMIN' || user.role === 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return <PatientDashboard />;
}
