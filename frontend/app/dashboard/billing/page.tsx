'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const canAccessInvoices =
    user?.role === 'STAFF' ||
    user?.role === 'CLINIC_ADMIN' ||
    user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (canAccessInvoices) {
      router.replace('/dashboard/front-desk/invoices');
    }
  }, [canAccessInvoices, router]);

  if (canAccessInvoices) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">Manage billing and invoices</p>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Billing</h2>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Billing and invoices are managed by your clinic. Contact your clinic
            administrator for billing questions.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
