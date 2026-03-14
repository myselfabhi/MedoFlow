'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getProviderAppointments,
  type ProviderAppointment,
} from '@/lib/patientApi';
import {
  getWeekRange,
  getNextWeek,
  getPrevWeek,
  formatWeekLabel,
  getTimeSlots,
  getAppointmentPosition,
  getDayColumn,
  getWeekDates,
  isToday,
} from '@/lib/calendarUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageContainer } from '@/components/layout';
import { AppPageHeader, AppButton } from '@/components/ui-system';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AppointmentSheet } from '@/components/calendar/AppointmentSheet';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const SLOT_HEIGHT_PX = 48;
const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'border-l-4 border-l-blue-500 bg-blue-50/50',
  COMPLETED: 'border-l-4 border-l-emerald-500 bg-emerald-50/50',
  CANCELLED: 'opacity-50 grayscale bg-slate-100',
  PENDING_PROVIDER_APPROVAL: 'border-l-4 border-l-purple-500 bg-purple-50/50',
  PENDING_PAYMENT: 'border-l-4 border-l-amber-500 bg-amber-50/50',
};

export default function ProviderCalendarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return getWeekRange(d).start;
  });
  const [selectedAppointment, setSelectedAppointment] = useState<ProviderAppointment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const isProvider = user?.role === 'PROVIDER';

  const { start, end } = useMemo(() => getWeekRange(weekStart), [weekStart]);
  const weekDates = useMemo(() => getWeekDates(start), [start]);

  const { data: appointments = [], refetch } = useQuery({
    queryKey: ['provider-appointments', start.toISOString(), end.toISOString()],
    queryFn: () => getProviderAppointments(start, end),
    enabled: isProvider && !!user?.clinicId,
  });

  const locations = useMemo(() => {
    const seen = new Set<string>();
    appointments.forEach((a) => {
      if (a.location?.id) seen.add(a.location.id);
    });
    return Array.from(seen).map((id) => {
      const apt = appointments.find((a) => a.location?.id === id);
      return { id, name: apt?.location?.name ?? id };
    });
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    if (locationFilter === 'all') return appointments;
    return appointments.filter((a) => a.location?.id === locationFilter);
  }, [appointments, locationFilter]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<number, ProviderAppointment[]>();
    weekDates.forEach((d, i) => map.set(i, []));
    filteredAppointments.forEach((apt) => {
      const aptDate = new Date(apt.startTime);
      const col = getDayColumn(aptDate);
      if (col >= 0 && col < 7) {
        map.get(col)?.push(apt);
      }
    });
    return map;
  }, [filteredAppointments, weekDates]);

  const handlePrevWeek = () => setWeekStart(getPrevWeek(weekStart));
  const handleNextWeek = () => setWeekStart(getNextWeek(weekStart));

  const handleAppointmentClick = (apt: ProviderAppointment) => {
    setSelectedAppointment(apt);
    setSheetOpen(true);
  };

  const handleSheetSuccess = () => {
    refetch();
  };

  useEffect(() => {
    if (user && !isProvider) {
      router.replace('/dashboard');
    }
  }, [user, isProvider, router]);

  if (!user) return null;
  if (!isProvider) return null;

  const timeSlots = getTimeSlots();

  return (
    <PageContainer className="space-y-8">
      <AppPageHeader
        title="Clinical Schedule"
        description="Your weekly consultation timeline and availability."
      />

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Schedule</h3>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <AppButton variant="ghost" size="icon" onClick={handlePrevWeek} className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm">
                  <ChevronLeft className="h-4 w-4" />
                </AppButton>
                <div className="px-4 text-xs font-black uppercase tracking-widest text-slate-500 min-w-[140px] text-center">
                  {formatWeekLabel(start, end)}
                </div>
                <AppButton variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm">
                  <ChevronRight className="h-4 w-4" />
                </AppButton>
              </div>
              <AppButton 
                variant="outline" 
                size="sm" 
                className="rounded-full border-slate-200 text-xs font-bold"
                onClick={() => setWeekStart(getWeekRange(new Date()).start)}
              >
                Today
              </AppButton>
            </div>
            
            <div className="flex items-center gap-4">
              {locations.length > 1 && (
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[200px] h-11 rounded-xl border-slate-100 bg-slate-50 font-medium">
                    <SelectValue placeholder="All Facilities" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    <SelectItem value="all">All Facilities</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[1000px] bg-white">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: '80px repeat(7, minmax(120px, 1fr))',
                  gridTemplateRows: `60px repeat(${timeSlots.length}, ${SLOT_HEIGHT_PX}px)`,
                }}
              >
                {/* Header Spacer */}
                <div className="sticky left-0 z-30 border-b border-r border-slate-50 bg-white" />
                
                {weekDates.map((d, i) => (
                  <div
                    key={i}
                    className={cn(
                      "sticky top-0 z-20 border-b border-slate-50 bg-white flex flex-col items-center justify-center transition-colors",
                      isToday(d) && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-primary-600"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em]",
                      isToday(d) ? "text-primary-600" : "text-slate-400"
                    )}>
                      {format(d, 'EEE')}
                    </span>
                    <span className={cn(
                      "text-xl font-black mt-0.5",
                      isToday(d) ? "text-primary-600" : "text-slate-900"
                    )}>
                      {format(d, 'd')}
                    </span>
                  </div>
                ))}

                {timeSlots.map((slot, rowIdx) => (
                  <React.Fragment key={rowIdx}>
                    <div className="sticky left-0 z-10 border-b border-r border-slate-50 bg-white py-1 pr-4 text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {format(slot, 'h a')}
                      </span>
                    </div>
                    {weekDates.map((d, colIdx) => {
                      const dayApts = appointmentsByDay.get(colIdx) ?? [];
                      const aptToRender = dayApts.find((apt) => {
                        const { top } = getAppointmentPosition(apt.startTime, apt.endTime);
                        return top === rowIdx;
                      });
                      
                      return (
                        <div
                          key={`${rowIdx}-${colIdx}`}
                          className={cn(
                            "relative border-b border-r border-slate-50 group",
                            isToday(d) && "bg-primary-50/10"
                          )}
                          style={{ minHeight: SLOT_HEIGHT_PX }}
                        >
                          {aptToRender && (() => {
                            const { height } = getAppointmentPosition(
                              aptToRender.startTime,
                              aptToRender.endTime
                            );
                            const statusColor = STATUS_COLORS[aptToRender.status] || 'bg-slate-50';
                            
                            return (
                              <div
                                key={aptToRender.id}
                                className={cn(
                                  "absolute inset-x-1 z-10 cursor-pointer overflow-hidden rounded-xl p-3 shadow-sm transition-all hover:shadow-md hover:z-20",
                                  statusColor
                                )}
                                style={{
                                  top: '4px',
                                  height: `${Math.max(1, height) * SLOT_HEIGHT_PX - 8}px`,
                                }}
                                onClick={() => handleAppointmentClick(aptToRender)}
                              >
                                <div className="flex h-full flex-col">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-xs font-black text-slate-900 uppercase tracking-tight">
                                      {aptToRender.patient.name}
                                    </p>
                                    <span className="text-[9px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded-md border border-slate-100">
                                      {format(new Date(aptToRender.startTime), 'h:mm')}
                                    </span>
                                  </div>
                                  <p className="truncate text-[10px] font-bold text-slate-500 mt-1">
                                    {aptToRender.service.name}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <ScrollBar orientation="horizontal" className="bg-slate-50" />
          </ScrollArea>
        </CardContent>
      </Card>

      <AppointmentSheet
        appointment={selectedAppointment}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={handleSheetSuccess}
      />
    </PageContainer>
  );
}
