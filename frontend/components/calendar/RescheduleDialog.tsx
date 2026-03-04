'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { rescheduleAppointment, type ProviderAppointment } from '@/lib/patientApi';
import { toast } from 'sonner';
import { format, addMinutes } from 'date-fns';

interface RescheduleDialogProps {
  appointment: ProviderAppointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RescheduleDialog({
  appointment,
  open,
  onOpenChange,
  onSuccess,
}: RescheduleDialogProps) {
  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);
  const duration = (end.getTime() - start.getTime()) / 60000;

  const [date, setDate] = useState(format(start, 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(start, 'HH:mm'));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newStart = new Date(`${date}T${time}`);
    const newEnd = addMinutes(newStart, duration);
    setIsSubmitting(true);
    try {
      await rescheduleAppointment(
        appointment.id,
        newStart.toISOString(),
        newEnd.toISOString()
      );
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error('Failed to reschedule appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Time</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
