import prisma from '../config/prisma';
import { ApiError } from '../types/errors';
import * as auditService from './auditService';

export const confirmPayment = async (
  appointmentId: string,
  performedById: string,
  where?: { clinicId?: string; patientId?: string }
) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, ...where },
    include: { service: true },
  });

  if (!appointment) {
    const err = new Error('Appointment not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  if (appointment.status !== 'PENDING_PAYMENT') {
    const err = new Error(
      'Appointment is not pending payment'
    ) as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  if (appointment.slotHeldUntil && appointment.slotHeldUntil < now) {
    const err = new Error('Slot hold has expired') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const amount = appointment.priceAtBooking;

  const [payment, updatedAppointment] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        clinicId: appointment.clinicId,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        amount,
        status: 'SUCCESS',
      },
    }),
    prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentDueAt: null,
        slotHeldUntil: null,
      },
      include: {
        clinic: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        provider: {
          include: {
            discipline: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
          },
        },
        service: { select: { id: true, name: true, duration: true } },
        patient: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  await auditService.logAudit({
    clinicId: appointment.clinicId,
    entityType: 'Payment',
    entityId: payment.id,
    action: 'PAYMENT_CONFIRMED',
    newValue: {
      appointmentId,
      amount: Number(amount),
      status: 'SUCCESS',
    },
    performedById,
  });

  return { payment, appointment: updatedAppointment };
};

export const failPayment = async (
  appointmentId: string,
  performedById: string,
  where?: { clinicId?: string; patientId?: string }
) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, ...where },
  });

  if (!appointment) {
    const err = new Error('Appointment not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  if (appointment.status !== 'PENDING_PAYMENT') {
    const err = new Error(
      'Appointment is not pending payment'
    ) as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const amount = appointment.priceAtBooking;

  const payment = await prisma.payment.create({
    data: {
      clinicId: appointment.clinicId,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      amount,
      status: 'FAILED',
    },
  });

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentStatus: 'FAILED' },
  });

  await auditService.logAudit({
    clinicId: appointment.clinicId,
    entityType: 'Payment',
    entityId: payment.id,
    action: 'PAYMENT_FAILED',
    newValue: {
      appointmentId,
      amount: Number(amount),
      status: 'FAILED',
    },
    performedById,
  });

  return { payment, appointment };
};

export const releaseExpiredPendingPayments = async (): Promise<number> => {
  const now = new Date();

  const expired = await prisma.appointment.findMany({
    where: {
      status: 'PENDING_PAYMENT',
      slotHeldUntil: { lt: now },
    },
    select: { id: true, clinicId: true, patientId: true, priceAtBooking: true },
  });

  if (expired.length === 0) return 0;

  for (const apt of expired) {
    await prisma.$transaction([
      prisma.payment.create({
        data: {
          clinicId: apt.clinicId,
          appointmentId: apt.id,
          patientId: apt.patientId,
          amount: apt.priceAtBooking,
          status: 'FAILED',
        },
      }),
      prisma.appointment.update({
        where: { id: apt.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
          cancelledAt: now,
          cancellationReason: 'Payment not completed within slot hold window',
          slotHeldUntil: null,
          paymentDueAt: null,
        },
      }),
    ]);

    await auditService.logAudit({
      clinicId: apt.clinicId,
      entityType: 'Appointment',
      entityId: apt.id,
      action: 'APPOINTMENT_PAYMENT_EXPIRED',
      newValue: {
        expiredAt: now.toISOString(),
        reason: 'Slot hold expired',
      },
      performedById: apt.patientId,
    });
  }

  return expired.length;
};
