'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { Plus } from 'lucide-react';

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPackages = async () => {
    try {
      const res = await api.get('/packages');
      setPackages(res.data.data.packages);
    } catch (error) {
      console.error('Failed to fetch packages', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Packages</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Package
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader>
                <CardTitle>{pkg.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {pkg.description || 'No description available.'}
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">${Number(pkg.price).toFixed(2)}</span>
                    <span className="text-sm">Sessions: {pkg.totalSessions || 'Unlimited'}</span>
                  </div>
                  {pkg.expiresInDays && (
                    <div className="text-xs text-muted-foreground">Expires in {pkg.expiresInDays} days</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {packages.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-10">
              No packages found. Add one to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
