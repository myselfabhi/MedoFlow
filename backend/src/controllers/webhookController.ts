import { Request, Response } from 'express';
import stripe from '../config/stripe';
import prisma from '../config/prisma';
import * as emailService from '../services/emailService';
import * as commissionService from '../services/commissionService';
import { PaymentStatus } from '@prisma/client';

const cancelCommissionRecords = async (invoiceId: string) => {
  await prisma.commissionRecord.updateMany({
    where: {
      invoiceId,
      status: 'PENDING',
    },
    data: {
      status: 'CANCELLED',
    },
  });
};

export const handleAppointmentPaymentIntentSucceeded = async (
  paymentIntent: any
) => {
  const { appointmentId } = paymentIntent.metadata || {};
  if (!appointmentId) return;

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      service: true,
      patient: true,
      provider: { include: { user: true } },
      location: true,
    },
  });

  if (!appt) return;

  const existingInvoice = await prisma.invoice.findFirst({
    where: { appointmentId },
  });
  const existingIntentPayment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
  });
  const shouldSendConfirmation = appt.paymentStatus !== PaymentStatus.PAID;

  if (
    existingIntentPayment?.status === PaymentStatus.PAID &&
    appt.paymentStatus === PaymentStatus.PAID &&
    existingInvoice?.status === 'PAID'
  ) {
    return;
  }

  const nextStatus =
    appt.approvalStatus === 'PENDING'
      ? 'PENDING_PROVIDER_APPROVAL'
      : 'CONFIRMED';

  const pendingPayment = await prisma.payment.findFirst({
    where: {
      appointmentId,
      OR: [
        { stripePaymentIntentId: paymentIntent.id },
        { status: PaymentStatus.PENDING },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  if (pendingPayment) {
    await prisma.payment.update({
      where: { id: pendingPayment.id },
      data: {
        status: PaymentStatus.PAID,
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret ?? null,
        paymentChannel: pendingPayment.paymentChannel ?? 'STRIPE',
        paymentMethod: pendingPayment.paymentMethod ?? 'CARD',
        recordedAt: pendingPayment.recordedAt ?? new Date(),
      },
    });
  } else {
    await prisma.payment.create({
      data: {
        clinicId: appt.clinicId,
        providerId: appt.providerId,
        invoiceId: existingInvoice?.id ?? null,
        appointmentId: appt.id,
        patientId: appt.patientId,
        amount: appt.paymentRequirementType === 'DEPOSIT' && appt.depositAmount
          ? appt.depositAmount
          : appt.priceAtBooking,
        status: PaymentStatus.PAID,
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret ?? null,
        paymentChannel: 'STRIPE',
        paymentMethod: 'CARD',
        recordedAt: new Date(),
      },
    });
  }

  if (appt.paymentStatus !== PaymentStatus.PAID || appt.status === 'PENDING_PAYMENT') {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: 'PAID',
        status: nextStatus as any,
        slotHeldUntil: null,
        bookingHoldExpiresAt: null,
      },
    });
  }

  if (!existingInvoice) {
    await prisma.invoice.create({
      data: {
        clinicId: appt.clinicId,
        patientId: appt.patientId,
        providerId: appt.providerId,
        appointmentId: appt.id,
        status: 'PAID',
        subtotal: appt.priceAtBooking,
        taxAmount: 0,
        totalAmount: appt.priceAtBooking,
        items: {
          create: {
            serviceId: appt.serviceId,
            description: appt.service.name,
            unitPrice: appt.priceAtBooking,
            quantity: 1,
            totalPrice: appt.priceAtBooking,
          },
        },
      },
    });
  } else if (existingInvoice.status !== 'PAID') {
    await prisma.invoice.update({
      where: { id: existingInvoice.id },
      data: { status: 'PAID' },
    });
  }

  if (shouldSendConfirmation) {
    await emailService.sendAppointmentConfirmation({
      to: appt.patient.email,
      patientName: appt.patient.name,
      appointmentDate: appt.startTime.toLocaleString(),
      serviceName: appt.service.name,
      providerName: `${appt.provider.firstName} ${appt.provider.lastName}`,
      locationName: appt.location?.name || 'Clinic',
    });
  }

  const inv = await prisma.invoice.findFirst({ where: { appointmentId } });
  if (inv) await commissionService.calculateCommissions(inv.id);
};

export const handleCartCheckoutPaymentIntentSucceeded = async (
  paymentIntent: any
) => {
  const { invoiceId, clinicId, patientId } = paymentIntent.metadata || {};
  if (!invoiceId || !clinicId || !patientId) return;

  const existingPaidPayment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
  });
  if (existingPaidPayment?.status === PaymentStatus.PAID) {
    return;
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true, patient: true },
  });
  if (!invoice) return;

  const wasAlreadyPaid = invoice.status === 'PAID';

  const pendingPayment = existingPaidPayment
    ? existingPaidPayment
    : await prisma.payment.findFirst({
        where: {
          invoiceId,
          patientId,
          clinicId,
          status: PaymentStatus.PENDING,
        },
        orderBy: { createdAt: 'desc' },
      });

  if (pendingPayment) {
    await prisma.payment.update({
      where: { id: pendingPayment.id },
      data: {
        status: PaymentStatus.PAID,
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret ?? null,
        paymentChannel: pendingPayment.paymentChannel ?? 'STRIPE',
        paymentMethod: pendingPayment.paymentMethod ?? 'CARD',
        recordedAt: pendingPayment.recordedAt ?? new Date(),
      },
    });
  } else {
    await prisma.payment.create({
      data: {
        clinicId,
        providerId: null,
        invoiceId,
        patientId,
        amount: invoice.totalAmount,
        status: PaymentStatus.PAID,
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret ?? null,
        paymentChannel: 'STRIPE',
        paymentMethod: 'CARD',
        recordedAt: new Date(),
      },
    });
  }

  if (wasAlreadyPaid) {
    return;
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'PAID' },
  });

  for (const item of invoice.items) {
    if (item.productId) {
      await prisma.inventoryItem.updateMany({
        where: { productId: item.productId, clinicId: invoice.clinicId },
        data: { quantityInStock: { decrement: item.quantity } },
      });
    }

    if (item.packageId) {
      const pkg = await prisma.package.findUnique({ where: { id: item.packageId } });
      if (pkg) {
        const existingPackage = await prisma.patientPackage.findFirst({
          where: {
            invoiceId: invoice.id,
            patientId: invoice.patientId,
            packageId: pkg.id,
          },
        });

        if (!existingPackage) {
          await prisma.patientPackage.create({
            data: {
              clinicId: invoice.clinicId,
              patientId: invoice.patientId,
              packageId: pkg.id,
              invoiceId: invoice.id,
              totalSessions: pkg.totalSessions ?? 0,
              expiresAt: pkg.expiresInDays
                ? new Date(Date.now() + pkg.expiresInDays * 24 * 60 * 60 * 1000)
                : null,
            },
          });
        }
      }
    }
  }

  await commissionService.calculateCommissions(invoiceId);

  await emailService.sendInvoiceEmail({
    to: invoice.patient.email,
    patientName: invoice.patient.name,
    totalAmount: `$${Number(invoice.totalAmount).toFixed(2)}`,
    invoiceUrl: `${process.env.FRONTEND_URL}/dashboard/patient/invoices/${invoice.id}`,
  });
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  if (endpointSecret) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
  } else {
    event = req.body;
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as any;
      const { type } = paymentIntent.metadata || {};

      if (type === 'APPOINTMENT') {
        await handleAppointmentPaymentIntentSucceeded(paymentIntent);
      }

      if (type === 'CART_CHECKOUT') {
        await handleCartCheckoutPaymentIntentSucceeded(paymentIntent);
      }
      break;
    }

    case 'invoice.paid': {
      const invoiceObject = event.data.object as any;
      if (invoiceObject.subscription) {
        const subId = invoiceObject.subscription;
        await prisma.patientSubscription.updateMany({
          where: { stripeSubscriptionId: subId },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: new Date(invoiceObject.period_start * 1000),
            currentPeriodEnd: new Date(invoiceObject.period_end * 1000),
          },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const deletedSub = event.data.object as any;
      await prisma.patientSubscription.updateMany({
        where: { stripeSubscriptionId: deletedSub.id },
        data: { status: 'CANCELED' },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const updatedSub = event.data.object as any;
      await prisma.patientSubscription.updateMany({
        where: { stripeSubscriptionId: updatedSub.id },
        data: {
          status: updatedSub.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
          cancelAtPeriodEnd: updatedSub.cancel_at_period_end,
        },
      });
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as any;
      const paymentIntentId = charge.payment_intent as string | undefined;
      if (!paymentIntentId) break;

      const payment = await prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
      });
      if (!payment?.invoiceId) break;

      await cancelCommissionRecords(payment.invoiceId);
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
