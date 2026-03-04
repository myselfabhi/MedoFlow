'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAppointmentsByPatient,
  getVisitsByPatient,
  getPrescriptionsByPatient,
} from '@/lib/patientTimelineApi';
import { getPlansByPatient } from '@/lib/treatmentPlanApi';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PatientFilesSection } from '@/components/PatientFilesSection';
import { format } from 'date-fns';

interface PatientRecordSheetProps {
  patientId: string;
  clinicId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(iso: string) {
  return format(new Date(iso), 'MMM d, yyyy');
}

function TimelineTab({ patientId, clinicId }: { patientId: string; clinicId?: string }) {
  const [apts, visits, rx] = useQueries({
    queries: [
      {
        queryKey: ['appointments', 'patient', patientId],
        queryFn: () => getAppointmentsByPatient(patientId, clinicId),
        enabled: !!patientId,
      },
      {
        queryKey: ['visits', 'patient', patientId],
        queryFn: () => getVisitsByPatient(patientId, clinicId),
        enabled: !!patientId && !!clinicId,
      },
      {
        queryKey: ['prescriptions', 'patient', patientId],
        queryFn: () => getPrescriptionsByPatient(patientId, clinicId),
        enabled: !!patientId && !!clinicId,
      },
    ],
  });

  const isLoading = apts.isLoading || visits.isLoading || rx.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const appointments = apts.data ?? [];
  const visitRecords = visits.data ?? [];
  const prescriptions = rx.data ?? [];

  const items: { type: string; title: string; date: string; id?: string }[] = [];

  appointments.forEach((a) => {
    items.push({
      type: 'Appointment',
      title: `${a.service.name} — ${a.location.name}`,
      date: a.startTime,
      id: a.id,
    });
  });
  visitRecords.forEach((v) => {
    items.push({
      type: 'Visit',
      title: 'Visit note finalized',
      date: v.updatedAt,
      id: v.id,
    });
  });
  prescriptions.forEach((p) => {
    items.push({
      type: 'Prescription',
      title: 'Prescription',
      date: p.createdAt,
      id: p.appointmentId,
    });
  });

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No timeline events yet.</p>
      ) : (
        items.map((item, i) => (
          <Card key={`${item.type}-${item.id ?? i}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Badge variant="outline" className="mb-1 text-xs">
                    {item.type}
                  </Badge>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                </div>
                {item.id && item.type === 'Appointment' && (
                  <a
                    href={`/dashboard/provider/appointments/${item.id}`}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    View
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function TreatmentPlansTab({ patientId }: { patientId: string }) {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['treatmentPlans', patientId],
    queryFn: () => getPlansByPatient(patientId),
    enabled: !!patientId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">No treatment plans yet.</p>
      ) : (
        plans.map((plan) => (
          <Card key={plan.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {plan.discipline.name} · {plan.sessionsCompleted}/{plan.totalSessions} sessions
                  </p>
                </div>
                <StatusBadge status={plan.status} variant="treatmentPlan" />
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export function PatientRecordSheet({
  patientId,
  clinicId,
  open,
  onOpenChange,
}: PatientRecordSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Patient Record</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="timeline" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[calc(100vh-12rem)] mt-4">
            <TabsContent value="timeline" className="mt-0">
              <TimelineTab patientId={patientId} clinicId={clinicId} />
            </TabsContent>
            <TabsContent value="plans" className="mt-0">
              <TreatmentPlansTab patientId={patientId} />
            </TabsContent>
            <TabsContent value="files" className="mt-0">
              <PatientFilesSection
                patientId={patientId}
                clinicId={clinicId}
                canDelete={false}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
