import prisma from '../config/prisma';
import { ApiError } from '../types/errors';
import * as auditService from './auditService';
import {
  PaymentRequirementType,
  PaymentStatus,
} from '@prisma/client';
import stripe from '../config/stripe';

const getAmountToCharge = (appointment: {
  paymentRequirementType: PaymentRequirementType;
  depositAmount: { toString(): string } | null;
  priceAtBooking: { toString(): string };
}) => {
  if (
    appointment.paymentRequirementType === PaymentRequirementType.DEPOSIT &&
    appointment.depositAmount
  ) {
    return Number(appointment.depositAmount);
  }
  return Number(appointment.priceAtBooking);
};

const getPendingPayment = async (appointmentId: string) => {
  return prisma.payment.findFirst({
    where: { appointmentId, status: PaymentStatus.PENDING },
    orderBy: { createdAt: 'desc' },
  });
};

export const ensurePaymentIntent = async (
  appointmentId: string,
  performedById: string,
  where?: { clinicId?: string; patientId?: string }
) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, ...where },
    select: {
      id: true,
      clinicId: true,
      providerId: true,
      patientId: true,
      status: true,
      paymentStatus: true,
      paymentRequirementType: true,
      depositAmount: true,
      priceAtBooking: true,
      bookingHoldExpiresAt: true,
    },
  });

  if (!appointment) {
    const err = new Error('Appointment not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  if (appointment.status !== 'PENDING_PAYMENT') {
    const err = new Error('Appointment is not pending payment') as ApiError;
    err.statusCode = 400;
    err.code = 'invalid_state';
    throw err;
  }

  if (
    appointment.bookingHoldExpiresAt &&
    appointment.bookingHoldExpiresAt.getTime() <= Date.now()
  ) {
    const err = new Error('Slot hold has expired') as ApiError;
    err.statusCode = 400;
    err.code = 'expired_hold';
    throw err;
  }

  const existing = await getPendingPayment(appointmentId);
  if (existing?.stripeClientSecret) {
    return {
      payment: existing,
      clientSecret: existing.stripeClientSecret,
      reused: true,
    };
  }

  if (existing?.stripePaymentIntentId) {
    try {
      const intent = await stripe.paymentIntents.retrieve(
        existing.stripePaymentIntentId
      );
      const clientSecret = intent.client_secret ?? existing.stripeClientSecret;
      if (clientSecret && clientSecret !== existing.stripeClientSecret) {
        await prisma.payment.update({
          where: { id: existing.id },
          data: { stripeClientSecret: clientSecret },
        });
      }
      return {
        payment: {
          ...existing,
          stripeClientSecret: clientSecret ?? existing.stripeClientSecret,
        },
        clientSecret,
        reused: true,
      };
    } catch (err) {
      console.error('Stripe PaymentIntent retrieve error:', err);
    }
  }

  const amountToCharge = getAmountToCharge(appointment);
  const amountInCents = Math.round(amountToCharge * 100);

  try {
    const intent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        appointmentId: appointment.id,
        clinicId: appointment.clinicId,
        patientId: appointment.patientId,
        type: 'APPOINTMENT',
      },
    });

    const payment = existing
      ? await prisma.payment.update({
          where: { id: existing.id },
          data: {
            stripePaymentIntentId: intent.id,
            stripeClientSecret: intent.client_secret ?? null,
          },
        })
      : await prisma.payment.create({
          data: {
            clinicId: appointment.clinicId,
            providerId: appointment.providerId,
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            amount: amountToCharge,
            status: PaymentStatus.PENDING,
            stripePaymentIntentId: intent.id,
            stripeClientSecret: intent.client_secret ?? null,
          },
        });

    await auditService.logAudit({
      clinicId: appointment.clinicId,
      entityType: 'Payment',
      entityId: payment.id,
      action: existing ? 'PAYMENT_INTENT_REUSED' : 'PAYMENT_INTENT_CREATED',
      newValue: {
        appointmentId: appointment.id,
        stripePaymentIntentId: intent.id,
      },
      performedById,
    });

    return {
      payment,
      clientSecret: intent.client_secret ?? null,
      reused: false,
    };
  } catch (err) {
    console.error('Stripe PaymentIntent create error:', err);
    return {
      payment: existing ?? null,
      clientSecret: null,
      reused: Boolean(existing),
    };
  }
};

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

  const nextStatus = appointment.approvalStatus === 'PENDING' 
    ? 'PENDING_PROVIDER_APPROVAL' 
    : 'CONFIRMED';

  const invoice = await prisma.invoice.findFirst({
    where: { appointmentId, clinicId: appointment.clinicId },
    select: { id: true },
  });

  const pendingPayment = await getPendingPayment(appointmentId);

  const [payment, updatedAppointment] = await prisma.$transaction([
    pendingPayment
      ? prisma.payment.update({
          where: { id: pendingPayment.id },
          data: {
            invoiceId: invoice?.id ?? null,
            status: PaymentStatus.PAID,
          },
        })
      : prisma.payment.create({
          data: {
            clinicId: appointment.clinicId,
            providerId: appointment.providerId,
            invoiceId: invoice?.id ?? null,
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            amount,
            status: PaymentStatus.PAID,
          },
        }),
    prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: nextStatus as any,
        paymentStatus: PaymentStatus.PAID,
        paymentDueAt: null,
        slotHeldUntil: null,
        bookingHoldExpiresAt: null,
      },
      include: {
        clinic: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        provider: {
          include: {
            disciplines: { include: { discipline: { select: { id: true, name: true } } } },
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
      status: 'PAID',
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

  const invoice = await prisma.invoice.findFirst({
    where: { appointmentId, clinicId: appointment.clinicId },
    select: { id: true },
  });

  const pendingPayment = await getPendingPayment(appointmentId);

  const [payment, updatedAppointment] = await prisma.$transaction([
    pendingPayment
      ? prisma.payment.update({
          where: { id: pendingPayment.id },
          data: {
            invoiceId: invoice?.id ?? null,
            status: PaymentStatus.FAILED,
          },
        })
      : prisma.payment.create({
          data: {
            clinicId: appointment.clinicId,
            providerId: appointment.providerId,
            invoiceId: invoice?.id ?? null,
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            amount,
            status: PaymentStatus.FAILED,
          },
        }),
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { paymentStatus: PaymentStatus.FAILED, updatedById: performedById },
      include: {
        clinic: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        provider: {
          include: {
            disciplines: { include: { discipline: { select: { id: true, name: true } } } },
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
    action: 'PAYMENT_FAILED',
    newValue: {
      appointmentId,
      amount: Number(amount),
      status: 'FAILED',
    },
    performedById,
  });

  return { payment, appointment: updatedAppointment };
};

export const releaseExpiredPendingPayments = async (): Promise<number> => {
  const now = new Date();

  const expired = await prisma.appointment.findMany({
    where: {
      status: 'PENDING_PAYMENT',
      bookingHoldExpiresAt: { lt: now },
    },
    select: {
      id: true,
      clinicId: true,
      patientId: true,
      providerId: true,
      priceAtBooking: true,
    },
  });

  if (expired.length === 0) return 0;

  for (const apt of expired) {
    const invoice = await prisma.invoice.findFirst({
      where: { appointmentId: apt.id, clinicId: apt.clinicId },
      select: { id: true },
    });
    const pendingPayment = await getPendingPayment(apt.id);
    await prisma.$transaction([
      pendingPayment
        ? prisma.payment.update({
            where: { id: pendingPayment.id },
            data: {
              invoiceId: invoice?.id ?? null,
              status: PaymentStatus.FAILED,
            },
          })
        : prisma.payment.create({
            data: {
              clinicId: apt.clinicId,
              providerId: apt.providerId,
              invoiceId: invoice?.id ?? null,
              appointmentId: apt.id,
              patientId: apt.patientId,
              amount: apt.priceAtBooking,
              status: PaymentStatus.FAILED,
            },
          }),
      prisma.appointment.update({
        where: { id: apt.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: PaymentStatus.FAILED,
          cancelledAt: now,
          cancellationReason: 'Payment not completed within slot hold window',
          slotHeldUntil: null,
          bookingHoldExpiresAt: null,
          paymentDueAt: null,
          updatedById: apt.patientId,
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

export const refundPayment = async (
  paymentId: string,
  performedById: string,
  where?: { clinicId?: string }
) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      status: PaymentStatus.PAID,
      ...(where?.clinicId && { clinicId: where.clinicId }),
    },
    include: {
      appointment: true,
    },
  });

  if (!payment) {
    const err = new Error('Successful payment not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  const existingRefund = await prisma.payment.findFirst({
    where: {
      refundForPaymentId: payment.id,
      status: PaymentStatus.REFUNDED,
    },
  });
  if (existingRefund) {
    const err = new Error('Payment already refunded') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const txOperations: any[] = [
    prisma.payment.create({
      data: {
        clinicId: payment.clinicId,
        providerId: payment.providerId ?? null,
        invoiceId: payment.invoiceId ?? null,
        appointmentId: payment.appointmentId,
        patientId: payment.patientId,
        amount: payment.amount.mul(-1),
        status: 'REFUNDED',
        refundForPaymentId: payment.id,
      },
    }),
  ];

  if (payment.appointmentId) {
    txOperations.push(
      prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { paymentStatus: PaymentStatus.REFUNDED, updatedById: performedById },
        include: {
          clinic: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
          provider: {
            include: {
              disciplines: {
                include: { discipline: { select: { id: true, name: true } } },
              },
              user: { select: { id: true, name: true } },
            },
          },
          service: { select: { id: true, name: true, duration: true } },
          patient: { select: { id: true, name: true, email: true } },
        },
      })
    );
  }

  const results = await prisma.$transaction(txOperations);
  const refund = results[0] as any;
  const updatedAppointment = payment.appointmentId ? results[1] : null;

  await auditService.logAudit({
    clinicId: payment.clinicId,
    entityType: 'Payment',
    entityId: payment.id,
    action: 'PAYMENT_REFUNDED',
    newValue: {
      refundPaymentId: refund.id,
      originalAmount: Number(payment.amount),
      refundAmount: Number(refund.amount),
    },
    performedById,
  });

  return { refund, appointment: updatedAppointment };
};
