'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getClinics } from '@/lib/clinicApi';
import { Card, CardContent } from '@/components/ui/Card';

export default function PublicHomePage() {
  const { data: clinics, isLoading, error } = useQuery({
    queryKey: ['clinics'],
    queryFn: getClinics,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          Failed to load clinics. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Find a Clinic
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Select a clinic to view services and book an appointment
        </p>
      </div>

      {!clinics || clinics.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-16 text-center shadow-sm">
          <p className="text-gray-500">No clinics available at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clinics.map((clinic) => (
            <Link key={clinic.id} href={`/clinic/${clinic.id}`}>
              <Card className="h-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="flex flex-col p-6">
                  <h2 className="text-xl font-semibold text-gray-900">{clinic.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">{clinic.email}</p>
                  <div className="mt-6 flex items-center text-sm font-medium text-primary-600">
                    View Services
                    <svg
                      className="ml-1 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
