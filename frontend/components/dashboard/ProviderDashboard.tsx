'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getProviderAppointments } from '@/lib/patientApi';
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
  CalendarDays, 
  Activity,
  Video,
  User,
  Clock,
  ChevronRight
} from 'lucide-react';
import { cn, getGreetingName } from '@/lib/utils';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ProviderDashboard() {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? '';

  if (user && user.role !== 'PROVIDER') {
    return null;
  }

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

  const todayAppointments = (appointments || []).filter((a) => {
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
        title={`Welcome, ${getGreetingName(user?.name, 'Provider')}`} 
        description="Here is what your clinical day looks like." 
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KPIStatCard 
          label="Today's Volume"
          value={isLoading ? '...' : upcomingToday.length}
          icon={CalendarDays}
          description="Scheduled consultations"
          iconClassName="text-[#1E3A5F] bg-[#F4F4F5]"
        />
        <KPIStatCard 
          label="Active Plans"
          value={isLoading ? '...' : plans.length}
          icon={Activity}
          description="Patients under your care"
          iconClassName="text-[#1E3A5F] bg-[#F4F4F5]"
        />
        <KPIStatCard 
          label="Next Break"
          value="12:30 PM"
          icon={Clock}
          description="Based on your schedule"
          iconClassName="text-[#1E3A5F] bg-[#F4F4F5]"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <AppCard className="overflow-hidden border border-[#E5E7EB] shadow-none">
            <AppCardHeader className="flex flex-row items-center justify-between border-b border-[#E5E7EB] bg-[#FAFAFA] py-6">
              <AppCardTitle className="text-xl font-bold">Clinical Queue</AppCardTitle>
              <AppButton asChild size="sm" variant="outline" className="border-[#E5E7EB] bg-white text-[#1E3A5F] hover:bg-[#FAFAFA]">
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
                        currentAppointment?.id === apt.id && "bg-[#F0FDFA]"
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
                              <span className="inline-flex items-center rounded-full bg-[#F0FDFA] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">
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
                        <AppButton variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                          <Link href={`/dashboard/provider/appointments/${apt.id}/consultation`}>
                            <Video className="h-4 w-4" />
                          </Link>
                        </AppButton>
                        <AppButton size="sm" className="rounded-lg bg-[#0D9488] text-white shadow-none hover:bg-[#0F766E]" asChild>
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
          <AppCard className="overflow-hidden border border-[#2B476A] bg-[#1E3A5F] text-white">
            <AppCardContent className="p-8 space-y-6">
              <h3 className="text-lg font-bold">Ready for Scribe?</h3>
              <p className="text-sm leading-relaxed text-white/75">
                Use Medoflow AI Scribe to automatically document your consultations and generate SOAP notes in seconds.
              </p>
              <AppButton className="w-full rounded-lg border-none bg-white font-bold text-[#1E3A5F] hover:bg-white/90">
                Learn how it works
              </AppButton>
            </AppCardContent>
          </AppCard>

          <AppCard className="overflow-hidden border border-[#E5E7EB] shadow-none">
            <AppCardHeader className="border-b border-[#E5E7EB] bg-[#FAFAFA]">
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
