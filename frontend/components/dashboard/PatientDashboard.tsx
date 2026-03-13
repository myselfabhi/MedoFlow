'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
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
import type { User } from '@/lib/types';
import { 
  CalendarPlus, 
  Calendar, 
  CreditCard, 
  Package, 
  ChevronRight, 
  Clock,
  History,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getMyAppointments, getMyPackages, type PatientAppointment } from '@/lib/patientApi';

export function PatientDashboard() {
  const { user, isLoading: userLoading } = useAuth();

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

  const upcoming = appointments
    .filter((a: PatientAppointment) => new Date(a.startTime) > new Date() && a.status !== 'CANCELLED')
    .sort((a: PatientAppointment, b: PatientAppointment) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const isLoading = userLoading || appointmentsLoading || packagesLoading;

  if (userLoading) {
    return (
      <PageContainer className="flex justify-center items-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
      </PageContainer>
    );
  }

  const bookHref = user?.clinicId ? `/clinic/${user.clinicId}` : '/';

  return (
    <PageContainer className="space-y-8">
      <AppPageHeader
        title={`Hello, ${user?.name?.split(' ')[0] || 'Patient'}`}
        description="Welcome to your care portal. Manage your health journey here."
        actions={
          <AppButton asChild className="rounded-full px-6 shadow-md">
            <Link href={bookHref}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Book New Appointment
            </Link>
          </AppButton>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KPIStatCard 
          label="Upcoming Visits"
          value={isLoading ? '...' : upcoming.length}
          icon={Calendar}
          iconClassName="text-blue-600 bg-blue-50"
          description="Your scheduled care"
        />
        <KPIStatCard 
          label="Active Packages"
          value={isLoading ? '...' : packages.length}
          icon={Package}
          iconClassName="text-purple-600 bg-purple-50"
          description="Pre-paid health sessions"
        />
        <KPIStatCard 
          label="Total Spent"
          value="$450.00"
          icon={CreditCard}
          iconClassName="text-emerald-600 bg-emerald-50"
          description="Patient ledger summary"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <AppCard className="border-none shadow-sm overflow-hidden">
            <AppCardHeader className="bg-slate-50/50 border-b-0 py-6">
              <AppCardTitle className="text-xl font-bold">Upcoming Appointments</AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="p-0">
              {isLoading ? (
                <div className="p-12 flex justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
                </div>
              ) : upcoming.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="font-medium">No upcoming appointments.</p>
                  <AppButton variant="ghost" asChild className="mt-2 text-primary-600">
                    <Link href={bookHref}>Schedule your next visit →</Link>
                  </AppButton>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcoming.map((apt: PatientAppointment) => (
                    <div key={apt.id} className="flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-100 text-slate-900 border border-slate-200">
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
                      <AppButton variant="ghost" size="sm" asChild className="rounded-full">
                        <Link href={`/dashboard/patient/appointments/${apt.id}`}>Details</Link>
                      </AppButton>
                    </div>
                  ))}
                </div>
              )}
            </AppCardContent>
          </AppCard>

          {/* Recent History Shortcut */}
          <AppCard className="border-none shadow-sm overflow-hidden">
            <AppCardHeader className="bg-slate-50/50 border-b-0 py-6">
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
          <AppCard className="bg-slate-900 text-white overflow-hidden">
            <AppCardContent className="p-8 space-y-6">
              <h3 className="text-lg font-bold">Visit our Store</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Purchase recommended supplements and wellness packages directly from your portal.
              </p>
              <AppButton className="w-full bg-primary-600 hover:bg-primary-700 border-none rounded-full font-bold shadow-lg" asChild>
                <Link href="/store">Explore Store</Link>
              </AppButton>
            </AppCardContent>
          </AppCard>

          <AppCard>
            <AppCardHeader>
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
    </PageContainer>
  );
}
