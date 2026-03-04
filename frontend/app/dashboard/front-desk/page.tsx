'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectedClinicId } from '@/contexts/ClinicContext';
import { getInvoices } from '@/lib/invoiceApi';
import { getClinicAppointments } from '@/lib/patientApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  const clinicId = useSelectedClinicId();

  const effectiveClinicId = clinicId ?? user?.clinicId ?? '';

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', effectiveClinicId],
    queryFn: () => getInvoices(effectiveClinicId),
    enabled: !!effectiveClinicId,
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['clinic-appointments', effectiveClinicId],
    queryFn: () => getClinicAppointments(effectiveClinicId),
    enabled: !!effectiveClinicId,
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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Front Desk Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of today&apos;s activity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unpaid Invoices
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '—' : unpaidInvoices.length}
            </div>
            <Link
              href="/dashboard/front-desk/invoices"
              className="mt-2 inline-block text-sm text-primary-600 hover:text-primary-700"
            >
              View invoices →
            </Link>
          </CardContent>
        </Card>
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
              {isLoading ? '—' : pendingPayments.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments Today</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-[120px] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
            </div>
          ) : upcomingToday.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming appointments today</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingToday.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">
                        {formatTime(apt.startTime)}
                      </TableCell>
                      <TableCell>{apt.patient?.name ?? '—'}</TableCell>
                      <TableCell>{apt.service?.name ?? '—'}</TableCell>
                      <TableCell>
                        {apt.provider
                          ? `${apt.provider.firstName} ${apt.provider.lastName}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={apt.status} variant="appointment" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
