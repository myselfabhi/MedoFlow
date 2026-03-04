'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cancelAppointment, type ProviderAppointment } from '@/lib/patientApi';
import { RescheduleDialog } from './RescheduleDialog';
import { useAppToast } from '@/hooks/useAppToast';
import { format } from 'date-fns';

interface AppointmentSheetProps {
  appointment: ProviderAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AppointmentSheet({
  appointment,
  open,
  onOpenChange,
  onSuccess,
}: AppointmentSheetProps) {
  const toast = useAppToast();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const canReschedule =
    appointment &&
    appointment.status !== 'CANCELLED' &&
    appointment.status !== 'RESCHEDULED' &&
    appointment.status !== 'COMPLETED';

  const canCancel =
    appointment &&
    appointment.status !== 'CANCELLED' &&
    appointment.status !== 'RESCHEDULED';

  const handleCancel = async () => {
    if (!appointment) return;
    setIsCancelling(true);
    try {
      await cancelAppointment(appointment.id);
      toast.success('Appointment cancelled');
      onSuccess();
      onOpenChange(false);
      setCancelOpen(false);
    } catch {
      toast.error('Failed to cancel appointment');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRescheduleSuccess = () => {
    setRescheduleOpen(false);
    onSuccess();
    toast.success('Appointment rescheduled');
  };

  if (!appointment) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Appointment Details</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Patient</p>
              <p className="mt-1 font-medium">{appointment.patient.name}</p>
              {appointment.patient.email && (
                <p className="text-sm text-muted-foreground">{appointment.patient.email}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Service</p>
              <p className="mt-1">{appointment.service.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
              <p className="mt-1">
                {format(new Date(appointment.startTime), 'EEEE, MMM d, yyyy · h:mm a')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <StatusBadge status={appointment.status} variant="appointment" className="mt-1" />
            </div>
          </div>
          <SheetFooter className="mt-8 gap-2">
            {canReschedule && (
              <Button variant="outline" onClick={() => setRescheduleOpen(true)}>
                Reschedule
              </Button>
            )}
            {canCancel && (
              <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                Cancel
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <RescheduleDialog
        appointment={appointment}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onSuccess={handleRescheduleSuccess}
      />

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the appointment for {appointment.patient.name}. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel appointment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
