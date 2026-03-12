'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Receipt } from 'lucide-react';

export default function PointOfSalePage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <Card className="border-amber-200 bg-amber-50/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-amber-900">
            <AlertTriangle className="h-5 w-5" />
            Walk-in POS is not enabled for live billing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-amber-950">
          <p>
            This screen previously simulated checkout success without creating
            real invoices or payments. That path has been disabled to avoid
            false front-desk billing.
          </p>
          <p>
            Use the clinic invoice workflow for real billing until a properly
            wired walk-in POS flow is implemented.
          </p>
          <Button asChild>
            <Link href="/dashboard/front-desk/invoices">
              <Receipt className="mr-2 h-4 w-4" />
              Open Invoices
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
