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
  KPIStatCard
} from '@/components/ui-system';
import { PageContainer } from '@/components/layout';
import { 
  Calendar, 
  CreditCard, 
  FileText, 
  CalendarDays, 
  ArrowRight, 
  Activity,
  Video,
  User,
  Clock
} from 'lucide-react';

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

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['treatment-plans', 'ACTIVE'],
    queryFn: () => getTreatmentPlans('ACTIVE'),
    enabled: !!clinicId,
  });

  const todayAppointments = appointments.filter((a) => {
    const d = new Date(a.startTime);
    return d >= today && d <= todayEnd;
  });

  const upcomingToday = todayAppointments
    .filter(a => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const currentAppointment = upcomingToday.find(a => {
    const now = new Date();
    return new Date(a.startTime) <= now && new Date(a.endTime) >= now;
  }) || upcomingToday.find(a => new Date(a.startTime) > new Date());

  const isLoading = appointmentsLoading || plansLoading;

  return (
    <PageContainer className="space-y-8">
      <AppPageHeader 
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Provider'}`} 
        description="Here is what your clinical day looks like." 
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KPIStatCard 
          label="Today's Volume"
          value={isLoading ? '...' : upcomingToday.length}
          icon={CalendarDays}
          description="Scheduled consultations"
          iconClassName="text-blue-600 bg-blue-50"
        />
        <KPIStatCard 
          label="Active Plans"
          value={isLoading ? '...' : plans.length}
          icon={Activity}
          description="Patients under your care"
          iconClassName="text-purple-600 bg-purple-50"
        />
        <KPIStatCard 
          label="Next Break"
          value="12:30 PM"
          icon={Clock}
          description="Based on your schedule"
          iconClassName="text-amber-600 bg-amber-50"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <AppCard className="border-none shadow-sm overflow-hidden">
            <AppCardHeader className="flex flex-row items-center justify-between bg-slate-50/50 border-b-0 py-6">
              <AppCardTitle className="text-xl font-bold">Clinical Queue</AppCardTitle>
              <AppButton asChild size="sm" variant="outline" className="bg-white">
                <Link href="/dashboard/provider/calendar">Full Calendar</Link>
              </AppButton>
            </AppCardHeader>
            <AppCardContent className="p-0">
              {isLoading ? (
                <div className="p-12 flex justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
                </div>
              ) : upcomingToday.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No appointments scheduled for today.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcomingToday.map((apt) => (
                    <div
                      key={apt.id}
                      className={cn(
                        "flex items-center justify-between px-6 py-5 transition-colors hover:bg-slate-50",
                        currentAppointment?.id === apt.id && "bg-primary-50/30"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-sm font-bold text-slate-400 w-16 pt-1">
                          {formatTime(apt.startTime)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-2">
                            {apt.patient?.name ?? 'Patient'}
                            {currentAppointment?.id === apt.id && (
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                Current
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {apt.service?.name ?? 'General Consultation'} · {(apt.service as any)?.duration || 30} min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {apt.meetLink && (
                          <AppButton variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                            <a href={apt.meetLink} target="_blank" rel="noopener noreferrer">
                              <Video className="h-4 w-4" />
                            </a>
                          </AppButton>
                        )}
                        <AppButton size="sm" className="rounded-full shadow-sm" asChild>
                          <Link href={`/dashboard/provider/appointments/${apt.id}`}>
                            Open Charts
                          </Link>
                        </AppButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AppCardContent>
          </AppCard>
        </div>

        {/* Side Actions / Insights */}
        <div className="space-y-6">
          <AppCard className="bg-primary-600 text-white overflow-hidden">
            <AppCardContent className="p-8 space-y-6">
              <h3 className="text-lg font-bold">Ready for Scribe?</h3>
              <p className="text-primary-100 text-sm leading-relaxed">
                Use Medoflow AI Scribe to automatically document your consultations and generate SOAP notes in seconds.
              </p>
              <AppButton className="w-full bg-white text-primary-600 hover:bg-primary-50 border-none rounded-full font-bold">
                Learn how it works
              </AppButton>
            </AppCardContent>
          </AppCard>

          <AppCard>
            <AppCardHeader>
              <AppCardTitle>Quick Links</AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="p-0">
              <div className="grid grid-cols-1 divide-y divide-slate-100">
                <Link href="/dashboard/provider/calendar" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">My Schedule</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>
                <Link href="/dashboard/provider/patients" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">My Patients</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>
                <Link href="/dashboard/analytics" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Personal Performance</span>
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

// Helper for conditional classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-9-6" />
    </svg>
  );
}
