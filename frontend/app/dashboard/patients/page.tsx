'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getClinicAppointments } from '@/lib/patientApi';
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppPageHeader,
  AppEmptyState,
  AppButton,
  KPIStatCard,
  AppTable
} from '@/components/ui-system';
import { PageContainer } from '@/components/layout';
import { StatusBadge } from '@/components/common/StatusBadge';
import { User, Calendar, Search, ArrowRight, Clock, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatientSummary {
  id: string;
  name: string;
  email: string;
  appointmentCount: number;
  lastAppointment?: string;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const ALLOWED_ROLES = ['SUPER_ADMIN', 'FRONT_DESK'] as const;

export default function PatientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? '';
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.role && !ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number])) {
      router.replace('/dashboard');
    }
  }, [user?.role, router]);

  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ['clinic-appointments', 'patients'],
    queryFn: () => getClinicAppointments(),
    enabled: !!clinicId,
  });

  const patients: PatientSummary[] = useMemo(() => {
    const map = new Map<string, PatientSummary>();
    for (const apt of appointments) {
      if (!apt.patient) continue;
      const existing = map.get(apt.patient.id);
      const aptDate = new Date(apt.startTime);
      if (!existing) {
        map.set(apt.patient.id, {
          id: apt.patient.id,
          name: apt.patient.name,
          email: apt.patient.email,
          appointmentCount: 1,
          lastAppointment: apt.startTime,
        });
      } else {
        existing.appointmentCount += 1;
        if (!existing.lastAppointment || aptDate > new Date(existing.lastAppointment)) {
          existing.lastAppointment = apt.startTime;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [appointments]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [patients, searchQuery]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const selectedAppointments = useMemo(
    () => appointments.filter((a) => a.patient?.id === selectedPatientId),
    [appointments, selectedPatientId]
  );

  if (!user?.role || !ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number])) return null;

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
      </div>
    );
  }

  return (
    <PageContainer className="space-y-8">
      <AppPageHeader
        title="Patient Directory"
        description="Search clinical records, histories, and patient details."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KPIStatCard
          label="Total Patients"
          value={patients.length}
          icon={User}
          iconClassName="text-blue-600 bg-blue-50"
        />
        <KPIStatCard
          label="New Patients"
          value={(() => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            // A patient is "new this month" if their earliest appointment is within this month
            const newCount = patients.filter((p) => {
              const patientApts = appointments.filter((a) => a.patient?.id === p.id);
              if (patientApts.length === 0) return false;
              const earliest = patientApts.reduce((min, a) =>
                new Date(a.startTime) < new Date(min.startTime) ? a : min
              );
              return new Date(earliest.startTime) >= startOfMonth;
            }).length;
            return newCount;
          })()}
          icon={Calendar}
          iconClassName="text-emerald-600 bg-emerald-50"
        />
        <KPIStatCard
          label="Active Appointments"
          value={appointments.filter(
            (a) => a.status === 'CONFIRMED' || a.status === 'PENDING_PROVIDER_APPROVAL' || a.status === 'PENDING_PAYMENT'
          ).length}
          icon={Clock}
          iconClassName="text-purple-600 bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left panel: Patient list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              className="w-full pl-10 pr-4 h-12 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <AppCard className="border-none shadow-sm overflow-hidden">
            <AppCardHeader className="bg-slate-50/50 border-b-0 py-4">
              <AppCardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Clinical Registry</AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="p-0 max-h-[600px] overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="p-8 text-center bg-white">
                  <p className="text-sm text-slate-400 font-medium">No matches found.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className={cn(
                        "w-full flex items-center gap-4 px-6 py-5 text-left transition-all hover:bg-slate-50",
                        selectedPatientId === p.id ? "bg-primary-50/50 border-l-4 border-l-primary-600" : "bg-white border-l-4 border-l-transparent"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500 font-medium truncate">{p.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </AppCardContent>
          </AppCard>
        </div>

        {/* Right panel: Patient record */}
        <div className="lg:col-span-2">
          {!selectedPatient ? (
            <AppCard className="h-full flex items-center justify-center border-none shadow-sm bg-white min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                  <Search className="h-8 w-8 text-slate-200" />
                </div>
                <p className="text-slate-400 font-medium max-w-xs mx-auto">Select a patient from the clinical registry to view their full record and timeline.</p>
              </div>
            </AppCard>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <AppCard className="border-none shadow-sm bg-white overflow-hidden">
                <AppCardHeader className="bg-slate-900 text-white p-8 border-none flex flex-row items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center text-3xl font-black text-white border border-white/10">
                      {selectedPatient.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black">{selectedPatient.name}</h2>
                      <div className="flex items-center gap-4 mt-2 text-slate-400 font-medium text-sm">
                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {selectedPatient.email}</span>
                        <span>·</span>
                        <span>Patient ID: {selectedPatient.id.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <AppButton variant="ghost" className="rounded-full border border-white/20 text-white bg-white/5 hover:bg-white/10 transition-all opacity-100" asChild>
                    <Link href={`/dashboard/provider/patients/${selectedPatient.id}/timeline`}>
                      Full Timeline <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </AppButton>
                </AppCardHeader>
                <AppCardContent className="p-8">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Recent Activity
                      </h3>
                      {selectedAppointments.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No appointments recorded for this patient.</p>
                      ) : (
                        <div className="overflow-x-auto -mx-8 px-8">
                          <AppTable
                            columns={[
                              { 
                                key: 'date', 
                                header: 'Visit Date', 
                                render: (apt) => (
                                  <div className="font-bold text-slate-900">{formatDateTime(apt.startTime).split(',')[0]}</div>
                                ) 
                              },
                              { 
                                key: 'service', 
                                header: 'Service', 
                                render: (apt) => (
                                  <div className="text-sm font-medium text-slate-600">{apt.service?.name ?? '—'}</div>
                                ) 
                              },
                              { 
                                key: 'status', 
                                header: 'Status', 
                                render: (apt) => <StatusBadge status={apt.status} variant="appointment" /> 
                              },
                              {
                                key: 'actions',
                                header: '',
                                render: (apt) => (
                                  <AppButton variant="ghost" size="sm" className="rounded-full text-primary-600 font-bold" asChild>
                                    <Link href={`/dashboard/provider/appointments/${apt.id}`}>View Charts</Link>
                                  </AppButton>
                                )
                              }
                            ]}
                            data={selectedAppointments.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 5)}
                            keyExtractor={(apt) => apt.id}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </AppCardContent>
              </AppCard>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
