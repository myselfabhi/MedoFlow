'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getClinics } from '@/lib/publicApi';
import { Card, CardContent } from '@/components/ui/Card';

export default function PublicHomePage() {
  const { data: clinics, isLoading, error } = useQuery({
    queryKey: ['clinics'],
    queryFn: getClinics,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4 text-red-700">Failed to load clinics.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find a Clinic</h1>
        <p className="mt-2 text-gray-600">Select a clinic to view services and book an appointment</p>
      </div>

      {!clinics || clinics.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No clinics available at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clinics.map((clinic) => (
            <Link key={clinic.id} href={`/clinic/${clinic.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900">{clinic.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">{clinic.email}</p>
                  <p className="mt-2 text-sm text-primary-600">View services →</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
