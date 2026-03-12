'use client';

import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { getPackageOperationalSummary, getPackages } from '@/lib/packageApi';

function formatMoney(value?: string | number | null) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

export default function PackagesPage() {
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => getPackages(true),
  });

  const { data: summary } = useQuery({
    queryKey: ['package-operational-summary'],
    queryFn: getPackageOperationalSummary,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Packages</h1>
        <Button disabled title="Catalog CRUD is not surfaced in this admin page yet">
          <Plus className="mr-2 h-4 w-4" /> Add Package
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Catalog</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {summary?.activeCatalogPackages ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Patient Packages</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {summary?.activePatientPackageCount ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Exhausted</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-amber-600">
            {summary?.exhaustedCount ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-700">
            {summary?.expiringSoonCount ?? 0}
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-slate-600">
        This page is operational package visibility. Package catalog create/edit remains backend-supported but is not exposed in this admin screen yet.
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{pkg.name}</CardTitle>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      pkg.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {pkg.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  {pkg.description || 'No description available.'}
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{formatMoney(pkg.price)}</span>
                    <span className="text-sm">Sessions: {pkg.totalSessions || 'Unlimited'}</span>
                  </div>
                  {pkg.expiresInDays ? (
                    <div className="text-xs text-muted-foreground">Expires in {pkg.expiresInDays} days</div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No catalog expiry</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {packages.length === 0 && (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              No packages found. Add one to get started.
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Patient Package State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(summary?.recentPatientPackages ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No package activity yet.</div>
          ) : (
            summary!.recentPatientPackages.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">{pkg.patient.name}</div>
                  <div className="text-sm text-slate-600">
                    {pkg.package.name} • {pkg.status}
                  </div>
                </div>
                <div className="text-right text-sm text-slate-600">
                  <div>{pkg.remainingSessions} sessions left</div>
                  <div>{pkg.expiresAt ? `Expires ${new Date(pkg.expiresAt).toLocaleDateString()}` : 'No expiry set'}</div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
