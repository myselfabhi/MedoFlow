'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
  AppPageHeader,
  AppButton,
} from '@/components/ui-system';
import { PageContainer } from '@/components/layout';
import Link from 'next/link';

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const canAccessInvoices =
    user?.role === 'FRONT_DESK' ||
    user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (canAccessInvoices) {
      router.replace('/dashboard/front-desk/invoices');
    }
  }, [canAccessInvoices, router]);

  if (canAccessInvoices) {
    return (
      <PageContainer className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-8">
      <AppPageHeader
        title="Billing"
        description="Manage billing and invoices"
      />
      <AppCard>
        <AppCardHeader>
          <AppCardTitle>Billing Information</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          <p className="text-sm text-muted-foreground">
            Billing and invoices are managed by your clinic. Contact your clinic
            administrator for billing questions.
          </p>
          <div className="mt-6">
            <AppButton variant="outline" size="sm" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </AppButton>
          </div>
        </AppCardContent>
      </AppCard>
    </PageContainer>
  );
}
