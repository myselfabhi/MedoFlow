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
import { Button } from '@/components/ui/button';
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

const SLOT_HEIGHT_PX = 40;
const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-800 border-amber-200',
  DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
  NO_SHOW: 'bg-gray-100 text-gray-600 border-gray-200',
  RESCHEDULED: 'bg-gray-100 text-gray-600 border-gray-200',
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
    queryKey: ['provider-appointments', user?.clinicId, start.toISOString(), end.toISOString()],
    queryFn: () => getProviderAppointments(user?.clinicId ?? undefined, start, end),
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
        <p className="mt-1 text-sm text-gray-500">Your weekly appointments</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Week</CardTitle>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[180px] text-center font-medium">
                  {formatWeekLabel(start, end)}
                </span>
                <Button variant="outline" size="icon" onClick={handleNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {locations.length > 1 && (
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
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
        <CardContent className="p-6">
          <ScrollArea className="w-full">
            <div className="min-w-[800px]">
              <div
                className="grid border"
                style={{
                  gridTemplateColumns: '60px repeat(7, minmax(100px, 1fr))',
                  gridTemplateRows: `48px repeat(${timeSlots.length}, ${SLOT_HEIGHT_PX}px)`,
                }}
              >
                <div className="sticky left-0 z-20 border-b border-r bg-background" />
                {weekDates.map((d, i) => (
                  <div
                    key={i}
                    className={`sticky top-0 z-20 border-b bg-background py-2 text-center text-sm font-medium ${
                      isToday(d) ? 'bg-primary/5' : ''
                    }`}
                  >
                    {format(d, 'EEE')}
                    <br />
                    <span className={isToday(d) ? 'text-primary font-semibold' : ''}>
                      {format(d, 'd')}
                    </span>
                  </div>
                ))}

                {timeSlots.map((slot, rowIdx) => (
                  <React.Fragment key={rowIdx}>
                    <div className="sticky left-0 z-10 border-b border-r bg-background py-1 pr-2 text-right text-xs text-muted-foreground">
                      {format(slot, 'h:mm a')}
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
                          className={`relative overflow-visible border-b ${
                            isToday(d) ? 'bg-primary/5' : 'bg-background'
                          }`}
                          style={{ minHeight: SLOT_HEIGHT_PX }}
                        >
                          {aptToRender && (() => {
                            const { top, height } = getAppointmentPosition(
                              aptToRender.startTime,
                              aptToRender.endTime
                            );
                            if (top !== rowIdx) return null;
                            const statusClass = STATUS_BADGE[aptToRender.status] ?? 'bg-gray-100';
                            return (
                              <Card
                                key={aptToRender.id}
                                className="absolute left-0.5 right-0.5 z-10 cursor-pointer overflow-hidden border shadow-sm transition-shadow hover:shadow-md"
                                style={{
                                  top: 0,
                                  height: `${Math.max(1, height) * SLOT_HEIGHT_PX - 2}px`,
                                }}
                                onClick={() => handleAppointmentClick(aptToRender)}
                              >
                                <div className="flex h-full flex-col justify-center p-2">
                                  <p className="truncate text-xs font-medium">{aptToRender.patient.name}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {aptToRender.service.name}
                                  </p>
                                  <span
                                    className={`mt-1 inline-block w-fit rounded px-1.5 py-0.5 text-[10px] font-medium ${statusClass}`}
                                  >
                                    {aptToRender.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              </Card>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      <AppointmentSheet
        appointment={selectedAppointment}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={handleSheetSuccess}
      />
    </div>
  );
}
