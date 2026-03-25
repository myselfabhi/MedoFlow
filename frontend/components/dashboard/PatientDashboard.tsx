'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppButton,
  AppPageHeader,
  KPIStatCard
} from '@/components/ui-system';
import { PageContainer } from '@/components/layout';
import {
  CalendarPlus,
  Calendar,
  CreditCard,
  Package,
  ChevronRight,
  Clock,
  History
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getMyAppointments, getMyInvoices, getMyPackages, type PatientAppointment } from '@/lib/patientApi';
import { getGreetingName } from '@/lib/utils';
import { BookAppointmentModal } from './BookAppointmentModal';

export function PatientDashboard() {
  const { user, isLoading: userLoading } = useAuth();
  const [bookingOpen, setBookingOpen] = useState(false);

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => getMyAppointments(),
    enabled: !!user,
  });

  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['patient-packages'],
    queryFn: () => getMyPackages(),
    enabled: !!user,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['patient-invoices'],
    queryFn: () => getMyInvoices(),
    enabled: !!user,
  });

  const appointmentsList = appointments || [];
  const upcoming = appointmentsList
    .filter((a: PatientAppointment) => a && a.startTime && new Date(a.startTime) > new Date() && a.status !== 'CANCELLED')
    .sort((a: PatientAppointment, b: PatientAppointment) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const isLoading = userLoading || appointmentsLoading || packagesLoading || invoicesLoading;

  if (userLoading) {
    return (
      <PageContainer className="flex justify-center items-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
      </PageContainer>
    );
  }

  if (user && user.role !== 'PATIENT') {
    return null;
  }

  const toNumber = (value: unknown) => {
    if (typeof value === 'number') return value;
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const outstandingBalance = (invoices || []).reduce(
    (sum, invoice: any) => sum + toNumber(invoice?.outstandingAmount),
    0
  );

  return (
    <PageContainer className="space-y-8">
      <AppPageHeader
        title={`Hello, ${getGreetingName(user?.name, 'Patient')}`}
        description="Welcome to your care portal. Manage your health journey here."
        actions={
          <AppButton className="rounded-full px-6 shadow-md" onClick={() => setBookingOpen(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Book New Appointment
          </AppButton>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KPIStatCard 
          label="Upcoming Visits"
          value={isLoading ? '...' : upcoming.length}
          icon={Calendar}
          iconClassName="text-[#1E3A5F] bg-[#F4F4F5]"
          description="Your scheduled care"
        />
        <KPIStatCard 
          label="Active Packages"
          value={isLoading ? '...' : (packages || []).length}
          icon={Package}
          iconClassName="text-[#1E3A5F] bg-[#F4F4F5]"
          description="Pre-paid health sessions"
        />
        <KPIStatCard 
          label="Outstanding Balance"
          value={isLoading ? '...' : `$${outstandingBalance.toFixed(2)}`}
          icon={CreditCard}
          iconClassName="text-[#1E3A5F] bg-[#F4F4F5]"
          description="Amount due across invoices"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <AppCard className="overflow-hidden border border-[#E5E7EB] shadow-none">
            <AppCardHeader className="border-b border-[#E5E7EB] bg-[#FAFAFA] py-6">
              <AppCardTitle className="text-xl font-bold">Upcoming Appointments</AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="p-0">
              {isLoading ? (
                <div className="p-12 flex justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
                </div>
              ) : upcoming.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4F4F5]">
                      <Calendar className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="font-medium">No upcoming appointments.</p>
                    <AppButton variant="ghost" asChild className="mt-2 text-[#0D9488] hover:bg-[#F0FDFA] hover:text-[#0F766E]">
                      <button onClick={() => setBookingOpen(true)}>Schedule your next visit →</button>
                    </AppButton>
                  </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcoming.map((apt: PatientAppointment) => (
                    <div key={apt.id} className="flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors">
                      <div className="flex gap-4">
                          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-slate-900">
                          <span className="text-[10px] uppercase font-bold text-slate-500">{new Date(apt.startTime).toLocaleString('en-US', { month: 'short' })}</span>
                          <span className="text-lg font-black leading-none">{new Date(apt.startTime).getDate()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{apt.service?.name || 'General Consultation'}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(apt.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                            <span>·</span>
                            <span>Dr. {apt.provider?.lastName || 'Staff'}</span>
                          </div>
                        </div>
                      </div>
                      <AppButton variant="ghost" size="sm" asChild className="rounded-lg text-[#0D9488] hover:bg-[#F0FDFA] hover:text-[#0F766E]">
                        <Link href={`/dashboard/patient/appointments/${apt.id}`}>Details</Link>
                      </AppButton>
                    </div>
                  ))}
                </div>
              )}
            </AppCardContent>
          </AppCard>

          {/* Recent History Shortcut */}
          <AppCard className="overflow-hidden border border-[#E5E7EB] shadow-none">
            <AppCardHeader className="border-b border-[#E5E7EB] bg-[#FAFAFA] py-6">
              <AppCardTitle className="text-xl font-bold">Recent Care Summaries</AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="p-0">
              <div className="p-8 text-center text-slate-500 bg-white">
                <History className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p>Summaries from your past visits will appear here.</p>
              </div>
            </AppCardContent>
          </AppCard>
        </div>

        {/* Side Actions */}
        <div className="space-y-6">
          <AppCard className="overflow-hidden border border-[#2B476A] bg-[#1E3A5F] text-white">
            <AppCardContent className="p-8 space-y-6">
              <h3 className="text-lg font-bold">Visit our Store</h3>
              <p className="text-sm leading-relaxed text-white/75">
                Purchase recommended supplements and wellness packages directly from your portal.
              </p>
              <AppButton className="w-full rounded-lg border-none bg-white font-bold text-[#1E3A5F] hover:bg-white/90" asChild>
                <Link href="/store">Explore Store</Link>
              </AppButton>
            </AppCardContent>
          </AppCard>

          <AppCard className="overflow-hidden border border-[#E5E7EB] shadow-none">
            <AppCardHeader className="border-b border-[#E5E7EB] bg-[#FAFAFA]">
              <AppCardTitle>Quick Links</AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="p-0">
              <div className="grid grid-cols-1 divide-y divide-slate-100">
                <Link href="/dashboard/patient/appointments" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">My Appointments</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>
                <Link href="/store?tab=memberships" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <History className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Memberships</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>
                <Link href="/dashboard/patient/billing" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Billing History</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>
              </div>
            </AppCardContent>
          </AppCard>
        </div>
      </div>

      <BookAppointmentModal
        open={bookingOpen}
        onOpenChange={setBookingOpen}
      />
    </PageContainer>
  );
}
