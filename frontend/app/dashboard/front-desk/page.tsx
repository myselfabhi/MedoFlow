'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getInvoices } from '@/lib/invoiceApi';
import { getClinicAppointments } from '@/lib/patientApi';
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppPageHeader,
} from '@/components/ui-system';
import { AppTable } from '@/components/ui-system/AppTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CreditCard, CalendarDays, DollarSign } from 'lucide-react';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function FrontDeskDashboardPage() {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? '';

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getInvoices(),
    enabled: !!clinicId,
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['clinic-appointments'],
    queryFn: () => getClinicAppointments(),
    enabled: !!clinicId,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const unpaidInvoices = invoices.filter(
    (i) => i.status === 'DRAFT' || i.status === 'FINALIZED' || i.status === 'PENDING_PAYMENT'
  );
  const todayAppointments = appointments.filter((a) => {
    const d = new Date(a.startTime);
    return d >= today && d <= todayEnd;
  });
  const pendingPayments = invoices.filter((i) => i.status === 'PENDING_PAYMENT' || i.status === 'FINALIZED');

  const upcomingToday = todayAppointments
    .filter((a) => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const isLoading = invoicesLoading || appointmentsLoading;

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Front Desk Dashboard"
        description="Overview of today's activity"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AppCard>
          <AppCardContent className="flex flex-row items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Unpaid Invoices
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {isLoading ? '—' : unpaidInvoices.length}
              </p>
              <Link
                href="/dashboard/front-desk/invoices"
                className="mt-2 inline-block text-sm text-accent hover:text-accent/90"
              >
                View invoices →
              </Link>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground/50" />
          </AppCardContent>
        </AppCard>
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
                {isLoading ? '—' : pendingPayments.length}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-muted-foreground/50" />
          </AppCardContent>
        </AppCard>
      </div>

      <AppCard>
        <AppCardHeader>
          <AppCardTitle>Upcoming Appointments Today</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          {isLoading ? (
            <div className="flex min-h-[120px] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
            </div>
          ) : upcomingToday.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming appointments today</p>
          ) : (
            <AppTable
              columns={[
                { key: 'time', header: 'Time', render: (apt) => formatTime(apt.startTime), className: 'font-medium' },
                { key: 'patient', header: 'Patient', render: (apt) => apt.patient?.name ?? '—' },
                { key: 'service', header: 'Service', render: (apt) => apt.service?.name ?? '—' },
                { key: 'provider', header: 'Provider', render: (apt) => apt.provider ? `${apt.provider.firstName} ${apt.provider.lastName}` : '—' },
                { key: 'status', header: 'Status', render: (apt) => <StatusBadge status={apt.status} variant="appointment" /> },
              ]}
              data={upcomingToday}
              keyExtractor={(apt) => apt.id}
            />
          )}
        </AppCardContent>
      </AppCard>
    </div>
  );
}
