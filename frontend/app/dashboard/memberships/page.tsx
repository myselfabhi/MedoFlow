'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { Plus } from 'lucide-react';

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMemberships = async () => {
    try {
      const res = await api.get('/memberships');
      setMemberships(res.data.data.memberships);
    } catch (error) {
      console.error('Failed to fetch memberships', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Memberships</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Membership
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {memberships.map((membership) => (
            <Card key={membership.id}>
              <CardHeader>
                <CardTitle>{membership.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {membership.description || 'No description available.'}
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">
                    ${Number(membership.monthlyPrice).toFixed(2)} / {membership.billingPeriod.toLowerCase()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {memberships.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-10">
              No memberships found. Add one to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
