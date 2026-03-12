import { Request, Response } from 'express';
import stripe from '../config/stripe';
import prisma from '../config/prisma';
import * as emailService from '../services/emailService';
import * as commissionService from '../services/commissionService';

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
    // For local testing without secret
    event = req.body;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as any;
      const { invoiceId, cartId, appointmentId, type, clinicId, patientId } = paymentIntent.metadata || {};

      if (type === 'APPOINTMENT' && appointmentId) {
        const appt = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: { service: true, patient: true, provider: { include: { user: true } }, location: true }
        });

        if (appt) {
          const nextStatus = appt.approvalStatus === 'PENDING' 
            ? 'PENDING_PROVIDER_APPROVAL' 
            : 'CONFIRMED';

          await prisma.appointment.update({
            where: { id: appointmentId },
            data: { 
              paymentStatus: 'PAID',
              status: nextStatus as any,
              slotHeldUntil: null,
              bookingHoldExpiresAt: null
            },
          });

          await prisma.payment.updateMany({
            where: {
              appointmentId,
              status: 'PENDING',
              OR: [
                { stripePaymentIntentId: paymentIntent.id },
                { stripePaymentIntentId: null },
              ],
            },
            data: {
              status: 'PAID',
              stripePaymentIntentId: paymentIntent.id,
              stripeClientSecret: paymentIntent.client_secret ?? null,
            },
          });

          // Send confirmation email
          await emailService.sendAppointmentConfirmation({
            to: appt.patient.email,
            patientName: appt.patient.name,
            appointmentDate: appt.startTime.toLocaleString(),
            serviceName: appt.service.name,
            providerName: `${appt.provider.firstName} ${appt.provider.lastName}`,
            locationName: appt.location?.name || 'Clinic',
          });

          // Create a basic invoice for this appointment if one doesn't exist
          const existingInvoice = await prisma.invoice.findFirst({
            where: { appointmentId }
          });

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
                    totalPrice: appt.priceAtBooking
                  }
                }
              }
            });
          } else {
            await prisma.invoice.update({
              where: { id: existingInvoice.id },
              data: { status: 'PAID' }
            });
          }

          // Calculate commissions for the appointment
          const inv = await prisma.invoice.findFirst({ where: { appointmentId } });
          if (inv) await commissionService.calculateCommissions(inv.id);
        }
      }

      if (type === 'CART_CHECKOUT' && invoiceId) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: 'PAID' },
        });

        // Calculate commissions for the cart checkout
        await commissionService.calculateCommissions(invoiceId);

        const invoice = await prisma.invoice.findUnique({
          where: { id: invoiceId },
          include: { items: true, patient: true },
        });

        if (invoice) {
          // Send receipt/invoice email
          await emailService.sendInvoiceEmail({
            to: invoice.patient.email,
            patientName: invoice.patient.name,
            totalAmount: `$${Number(invoice.totalAmount).toFixed(2)}`,
            invoiceUrl: `${process.env.FRONTEND_URL}/dashboard/patient/invoices/${invoice.id}`,
          });

          for (const item of invoice.items) {
            // 1. Physical Product inventory
            if (item.productId) {
              await prisma.inventoryItem.updateMany({
                where: { productId: item.productId, clinicId: invoice.clinicId },
                data: { quantityInStock: { decrement: item.quantity } },
              });
            }

            // 2. Provision Wellness Packages
            if (item.packageId) {
              const pkg = await prisma.package.findUnique({ where: { id: item.packageId } });
              if (pkg) {
                await prisma.patientPackage.create({
                  data: {
                    clinicId: invoice.clinicId,
                    patientId: invoice.patientId,
                    packageId: pkg.id,
                    invoiceId: invoice.id,
                    totalSessions: pkg.totalSessions ?? 0,
                    expiresAt: pkg.expiresInDays 
                      ? new Date(Date.now() + pkg.expiresInDays * 24 * 60 * 60 * 1000)
                      : null
                  }
                });
              }
            }

            // 3. Provision Memberships
            if (item.membershipId) {
              const membership = await prisma.membership.findUnique({ where: { id: item.membershipId } });
              if (membership) {
                await prisma.patientSubscription.create({
                  data: {
                    clinicId: invoice.clinicId,
                    patientId: invoice.patientId,
                    membershipId: membership.id,
                    status: 'ACTIVE',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
                  }
                });
              }
            }
          }
        }
      }
      break;
    
    case 'invoice.paid':
      const invoiceObject = event.data.object as any;
      if (invoiceObject.subscription) {
        // Find subscription and update its status
        const subId = invoiceObject.subscription;
        await prisma.patientSubscription.updateMany({
          where: { stripeSubscriptionId: subId },
          data: { 
            status: 'ACTIVE',
            currentPeriodStart: new Date(invoiceObject.period_start * 1000),
            currentPeriodEnd: new Date(invoiceObject.period_end * 1000),
          }
        });
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object as any;
      await prisma.patientSubscription.updateMany({
        where: { stripeSubscriptionId: deletedSub.id },
        data: { status: 'CANCELED' }
      });
      break;

    case 'customer.subscription.updated':
      const updatedSub = event.data.object as any;
      await prisma.patientSubscription.updateMany({
        where: { stripeSubscriptionId: updatedSub.id },
        data: { 
          status: updatedSub.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
          cancelAtPeriodEnd: updatedSub.cancel_at_period_end
        }
      });
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
