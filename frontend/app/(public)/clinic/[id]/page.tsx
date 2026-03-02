'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getClinic, getClinicServices, type Service } from '@/lib/publicApi';
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
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4 text-red-700">Clinic not found.</div>
        <Link href="/" className="mt-4 inline-block text-primary-600 hover:underline">
          ← Back to clinics
        </Link>
      </div>
    );
  }

  if (isLoading || !clinic) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-block text-sm text-primary-600 hover:underline">
        ← Back to clinics
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{clinic.name}</h1>
        <p className="mt-1 text-gray-600">{clinic.email}</p>
      </div>

      <div className="space-y-8">
        {Object.entries(byDiscipline).map(([disciplineName, disciplineServices]) => (
          <Card key={disciplineName}>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">{disciplineName}</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {disciplineServices.map((svc) => (
                  <div
                    key={svc.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{svc.name}</p>
                      <p className="text-sm text-gray-500">
                        {svc.duration} min · ${svc.defaultPrice}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/book/${svc.id}?clinicId=${id}`)}
                      className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
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
            <CardContent className="py-12 text-center text-gray-500">
              No services available at this clinic.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
