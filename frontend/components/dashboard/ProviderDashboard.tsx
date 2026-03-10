'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getProviderAppointments } from '@/lib/patientApi';
import { getInvoices } from '@/lib/invoiceApi';
import { getTreatmentPlans } from '@/lib/treatmentPlanApi';
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppButton,
  AppPageHeader,
} from '@/components/ui-system';
import { Calendar, CreditCard, FileText, CalendarDays } from 'lucide-react';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ProviderDashboard() {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['provider-appointments', today.toISOString()],
    queryFn: () => getProviderAppointments(today, todayEnd),
    enabled: !!clinicId,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', 'PENDING_PAYMENT'],
    queryFn: () => getInvoices('PENDING_PAYMENT'),
    enabled: !!clinicId,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['treatment-plans', 'ACTIVE'],
    queryFn: () => getTreatmentPlans('ACTIVE'),
    enabled: !!clinicId,
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
      <AppPageHeader title="Dashboard" description="Welcome back" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AppCard>
          <AppCardContent className="flex flex-row items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Today&apos;s Appointments
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {isLoading ? '—' : todayAppointments.length}
              </p>
            </div>
            <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
          </AppCardContent>
        </AppCard>
        <AppCard>
          <AppCardContent className="flex flex-row items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending Payments
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {isLoading ? '—' : invoices.length}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-muted-foreground/50" />
          </AppCardContent>
        </AppCard>
        <AppCard>
          <AppCardContent className="flex flex-row items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Treatment Plans
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {isLoading ? '—' : plans.length}
              </p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </AppCardContent>
        </AppCard>
      </div>

      <AppCard>
        <AppCardHeader className="flex flex-row items-center justify-between">
          <AppCardTitle>Today&apos;s Schedule</AppCardTitle>
          <AppButton asChild size="sm" variant="outline">
            <Link href="/dashboard/provider/calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Open Calendar
            </Link>
          </AppButton>
        </AppCardHeader>
        <AppCardContent>
          {isLoading ? (
            <div className="flex min-h-[120px] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
            </div>
          ) : nextFive.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments today</p>
          ) : (
            <ul className="space-y-2">
              {nextFive.map((apt) => (
                <li
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-subtle"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {apt.patient?.name ?? 'Patient'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {apt.service?.name ?? '—'} · {formatTime(apt.startTime)}
                    </p>
                  </div>
                  <AppButton variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/provider/appointments/${apt.id}`}>
                      View
                    </Link>
                  </AppButton>
                </li>
              ))}
            </ul>
          )}
        </AppCardContent>
      </AppCard>
    </div>
  );
}
