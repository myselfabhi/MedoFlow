'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getClinic } from '@/lib/clinicApi';
import { getClinicServices } from '@/lib/serviceApi';
import type { Service } from '@/lib/types/booking';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function ClinicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: clinic, isLoading: clinicLoading, error: clinicError } = useQuery({
    queryKey: ['clinic', id],
    queryFn: () => getClinic(id),
    enabled: !!id,
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['clinic-services', id],
    queryFn: () => getClinicServices(id),
    enabled: !!id,
  });

  const isLoading = clinicLoading || servicesLoading;

  if (clinicError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          Clinic not found.
        </div>
        <Link
          href="/"
          className="mt-6 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          ← Back to clinics
        </Link>
      </div>
    );
  }

  if (isLoading || !clinic) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const byDiscipline = (services || []).reduce<Record<string, Service[]>>((acc, svc) => {
    const d = svc.discipline.name;
    if (!acc[d]) acc[d] = [];
    acc[d].push(svc);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        ← Back to clinics
      </Link>

      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{clinic.name}</h1>
        <p className="mt-1 text-gray-600">{clinic.email}</p>
      </div>

      <div className="space-y-10">
        {Object.entries(byDiscipline).map(([disciplineName, disciplineServices]) => (
          <Card key={disciplineName} className="overflow-hidden">
            <CardHeader className="bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">{disciplineName}</h2>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {disciplineServices.map((svc) => (
                  <div
                    key={svc.id}
                    className="flex flex-col items-start justify-between gap-4 border-gray-100 p-6 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{svc.name}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {svc.duration} min · ${svc.defaultPrice}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/book/${svc.id}?clinicId=${id}`)}
                      className="shrink-0 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                    >
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {(!services || services.length === 0) && (
          <Card>
            <CardContent className="py-16 text-center text-gray-500">
              No services available at this clinic.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
