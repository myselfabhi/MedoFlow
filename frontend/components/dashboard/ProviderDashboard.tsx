'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectedClinicId } from '@/contexts/ClinicContext';
import { getProviderAppointments } from '@/lib/patientApi';
import { getInvoices } from '@/lib/invoiceApi';
import { getTreatmentPlans } from '@/lib/treatmentPlanApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, FileText, CalendarDays } from 'lucide-react';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ProviderDashboard() {
  const { user } = useAuth();
  const clinicId = useSelectedClinicId();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['provider-appointments', clinicId, today.toISOString()],
    queryFn: () =>
      getProviderAppointments(clinicId ?? undefined, today, todayEnd),
    enabled: !!clinicId || !!user?.clinicId,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', clinicId, 'PENDING_PAYMENT'],
    queryFn: () => getInvoices(clinicId ?? undefined, 'PENDING_PAYMENT'),
    enabled: !!clinicId || !!user?.clinicId,
  });

  const effectiveClinicId = clinicId ?? user?.clinicId ?? '';

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['treatment-plans', effectiveClinicId, 'ACTIVE'],
    queryFn: () => getTreatmentPlans(effectiveClinicId, 'ACTIVE'),
    enabled: !!effectiveClinicId,
  });

  const todayAppointments = appointments.filter((a) => {
    const d = new Date(a.startTime);
    return d >= today && d <= todayEnd;
  });

  const nextFive = todayAppointments
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  const isLoading = appointmentsLoading || invoicesLoading || plansLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome back</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Appointments
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '—' : todayAppointments.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '—' : invoices.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Treatment Plans
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '—' : plans.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today&apos;s Schedule</CardTitle>
          <Button asChild size="sm">
            <Link href="/dashboard/provider/calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Open Calendar
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-[120px] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
            </div>
          ) : nextFive.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments today</p>
          ) : (
            <ul className="space-y-3">
              {nextFive.map((apt) => (
                <li
                  key={apt.id}
                  className="flex items-center justify-between rounded-md border border-gray-100 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {apt.patient?.name ?? 'Patient'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {apt.service?.name ?? '—'} · {formatTime(apt.startTime)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/provider/appointments/${apt.id}`}>
                      View
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
