import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import stripe from '../config/stripe';
import * as auditService from '../services/auditService';
import * as cartService from '../services/cartService';
import * as invoiceService from '../services/invoiceService';
import * as paymentService from '../services/paymentService';
import * as appointmentController from '../controllers/appointmentController';
import * as appointmentService from '../services/appointmentService';
import * as webhookController from '../controllers/webhookController';
import * as commissionService from '../services/commissionService';
import * as emailService from '../services/emailService';

const restore = <T extends object, K extends keyof T>(
  object: T,
  key: K,
  value: T[K]
) => {
  object[key] = value;
};

test('invoice finalize and pay path updates statuses cleanly', async () => {
  const originalFindFirst = prisma.invoice.findFirst;
  const originalUpdate = prisma.invoice.update;
  const originalLogAudit = auditService.logAudit;

  const updatedStatuses: string[] = [];

  try {
    let currentStatus = 'DRAFT';
    (prisma.invoice.findFirst as any) = async () => ({
      id: 'invoice-1',
      clinicId: 'clinic-1',
      status: currentStatus,
      totalAmount: { toNumber: () => 125 },
      items: [{ id: 'item-1' }],
    });
    (prisma.invoice.update as any) = async ({
      data,
    }: {
      data: { status: string };
    }) => {
      currentStatus = data.status;
      updatedStatuses.push(data.status);
      return {
        id: 'invoice-1',
        clinicId: 'clinic-1',
        status: data.status,
        totalAmount: { toNumber: () => 125 },
        items: [],
        appointment: null,
        patient: null,
        provider: null,
      };
    };
    (auditService.logAudit as any) = async () => {};

    const finalized = await invoiceService.finalizeInvoice(
      'invoice-1',
      'clinic-1',
      'user-1'
    );
    assert.equal(finalized.status, 'FINALIZED');

    const paid = await invoiceService.payInvoice('invoice-1', 'clinic-1', 'user-1');
    assert.equal(paid.status, 'PAID');
    assert.deepEqual(updatedStatuses, ['FINALIZED', 'PAID']);
  } finally {
    restore(prisma.invoice, 'findFirst', originalFindFirst);
    restore(prisma.invoice, 'update', originalUpdate);
    restore(auditService, 'logAudit', originalLogAudit);
  }
});

test('membership cart add is rejected because recurring linkage is not supported', async () => {
  const originalGetOrCreateCart = cartService.getOrCreateCart;

  try {
    (cartService.getOrCreateCart as any) = async () => ({ id: 'cart-1' });

    await assert.rejects(
      () =>
        cartService.addToCart('clinic-1', 'patient-1', {
          itemType: 'MEMBERSHIP',
          itemId: 'membership-1',
        } as any),
      (err: any) =>
        err?.statusCode === 400 &&
        err?.code === 'membership_checkout_unsupported'
    );
  } finally {
    restore(cartService, 'getOrCreateCart', originalGetOrCreateCart);
  }
});

test('cart checkout creates a finalized invoice and pending payment ledger row', async () => {
  const originalCartFindFirst = prisma.cart.findFirst;
  const originalInvoiceCreate = prisma.invoice.create;
  const originalRecalculate = invoiceService.recalculateInvoiceTotals;
  const originalInvoiceFindUnique = prisma.invoice.findUnique;
  const originalStripeCreate = stripe.paymentIntents.create;
  const originalTransaction = prisma.$transaction;
  const originalInvoiceUpdate = prisma.invoice.update;
  const originalPaymentCreate = prisma.payment.create;
  const originalCartUpdate = prisma.cart.update;

  let createdInvoiceProviderId: string | null | undefined;
  let invoiceFinalized = false;
  let paymentCreateCount = 0;
  let cartCheckedOut = false;

  try {
    (prisma.cart.findFirst as any) = async () => ({
      id: 'cart-1',
      clinicId: 'clinic-1',
      patientId: 'patient-1',
      status: 'ACTIVE',
      items: [
        {
          id: 'item-1',
          itemType: 'PRODUCT',
          quantity: 2,
          unitPrice: new Prisma.Decimal(50),
          productId: 'product-1',
          serviceId: null,
          packageId: null,
          membershipId: null,
        },
      ],
    });
    (prisma.invoice.create as any) = async ({ data }: any) => {
      createdInvoiceProviderId = data.providerId;
      return { id: 'invoice-1' };
    };
    (invoiceService.recalculateInvoiceTotals as any) = async () => {};
    (prisma.invoice.findUnique as any) = async () => ({
      id: 'invoice-1',
      totalAmount: { toNumber: () => 100 },
    });
    (stripe.paymentIntents.create as any) = async () => ({
      id: 'pi_cart_1',
      client_secret: 'secret_1',
    });
    (prisma.invoice.update as any) = async () => {
      invoiceFinalized = true;
      return { id: 'invoice-1' };
    };
    (prisma.payment.create as any) = async () => {
      paymentCreateCount += 1;
      return { id: 'payment-1' };
    };
    (prisma.cart.update as any) = async () => {
      cartCheckedOut = true;
      return { id: 'cart-1' };
    };
    (prisma.$transaction as any) = async (operations: any[]) => Promise.all(operations);

    const result = await cartService.checkoutCart('clinic-1', 'patient-1');

    assert.equal(createdInvoiceProviderId, undefined);
    assert.equal(result.clientSecret, 'secret_1');
    assert.equal(invoiceFinalized, true);
    assert.equal(paymentCreateCount, 1);
    assert.equal(cartCheckedOut, true);
  } finally {
    restore(prisma.cart, 'findFirst', originalCartFindFirst);
    restore(prisma.invoice, 'create', originalInvoiceCreate);
    restore(invoiceService, 'recalculateInvoiceTotals', originalRecalculate);
    restore(prisma.invoice, 'findUnique', originalInvoiceFindUnique);
    restore(stripe.paymentIntents, 'create', originalStripeCreate);
    restore(prisma, '$transaction', originalTransaction);
    restore(prisma.invoice, 'update', originalInvoiceUpdate);
    restore(prisma.payment, 'create', originalPaymentCreate);
    restore(prisma.cart, 'update', originalCartUpdate);
  }
});

test('cart webhook payment handling is idempotent and provisions sale side effects once', async () => {
  const originalPaymentFindUnique = prisma.payment.findUnique;
  const originalPaymentFindFirst = prisma.payment.findFirst;
  const originalPaymentUpdate = prisma.payment.update;
  const originalInvoiceFindUnique = prisma.invoice.findUnique;
  const originalInvoiceUpdate = prisma.invoice.update;
  const originalInventoryUpdateMany = prisma.inventoryItem.updateMany;
  const originalPackageFindUnique = prisma.package.findUnique;
  const originalPatientPackageFindFirst = prisma.patientPackage.findFirst;
  const originalPatientPackageCreate = prisma.patientPackage.create;
  const originalCalculateCommissions = commissionService.calculateCommissions;
  const originalSendInvoiceEmail = emailService.sendInvoiceEmail;

  let paymentStatus: string | null = 'PENDING';
  let invoiceStatus: string = 'FINALIZED';
  let inventoryDecrements = 0;
  let patientPackageCreates = 0;
  let commissionCalls = 0;
  let emailCalls = 0;

  try {
    (prisma.payment.findUnique as any) = async ({
      where,
    }: {
      where: { stripePaymentIntentId: string };
    }) =>
      paymentStatus
        ? {
            id: 'payment-1',
            status: paymentStatus,
            stripePaymentIntentId: where.stripePaymentIntentId,
          }
        : null;
    (prisma.payment.findFirst as any) = async () => ({
      id: 'payment-1',
      status: 'PENDING',
    });
    (prisma.payment.update as any) = async ({ data }: any) => {
      paymentStatus = data.status;
      return { id: 'payment-1' };
    };
    (prisma.invoice.findUnique as any) = async () => ({
      id: 'invoice-1',
      clinicId: 'clinic-1',
      patientId: 'patient-1',
      status: invoiceStatus,
      totalAmount: 75,
      patient: { email: 'patient@example.com', name: 'Patient One' },
      items: [
        { id: 'item-1', productId: 'product-1', packageId: null, quantity: 2 },
        { id: 'item-2', productId: null, packageId: 'package-1', quantity: 1 },
      ],
    });
    (prisma.invoice.update as any) = async ({ data }: any) => {
      invoiceStatus = data.status;
      return { id: 'invoice-1' };
    };
    (prisma.inventoryItem.updateMany as any) = async () => {
      inventoryDecrements += 1;
      return { count: 1 };
    };
    (prisma.package.findUnique as any) = async () => ({
      id: 'package-1',
      totalSessions: 5,
      expiresInDays: 30,
    });
    (prisma.patientPackage.findFirst as any) = async () =>
      patientPackageCreates > 0 ? { id: 'pp-1' } : null;
    (prisma.patientPackage.create as any) = async () => {
      patientPackageCreates += 1;
      return { id: 'pp-1' };
    };
    (commissionService.calculateCommissions as any) = async () => {
      commissionCalls += 1;
    };
    (emailService.sendInvoiceEmail as any) = async () => {
      emailCalls += 1;
    };

    const event = {
      id: 'evt_1',
      metadata: {
        invoiceId: 'invoice-1',
        clinicId: 'clinic-1',
        patientId: 'patient-1',
      },
      idempotencyKey: 'same',
      client_secret: 'secret',
    };

    await webhookController.handleCartCheckoutPaymentIntentSucceeded({
      id: 'pi_cart_paid',
      metadata: event.metadata,
      client_secret: 'secret',
    });
    await webhookController.handleCartCheckoutPaymentIntentSucceeded({
      id: 'pi_cart_paid',
      metadata: event.metadata,
      client_secret: 'secret',
    });

    assert.equal(invoiceStatus, 'PAID');
    assert.equal(inventoryDecrements, 1);
    assert.equal(patientPackageCreates, 1);
    assert.equal(commissionCalls, 1);
    assert.equal(emailCalls, 1);
  } finally {
    restore(prisma.payment, 'findUnique', originalPaymentFindUnique);
    restore(prisma.payment, 'findFirst', originalPaymentFindFirst);
    restore(prisma.payment, 'update', originalPaymentUpdate);
    restore(prisma.invoice, 'findUnique', originalInvoiceFindUnique);
    restore(prisma.invoice, 'update', originalInvoiceUpdate);
    restore(prisma.inventoryItem, 'updateMany', originalInventoryUpdateMany);
    restore(prisma.package, 'findUnique', originalPackageFindUnique);
    restore(prisma.patientPackage, 'findFirst', originalPatientPackageFindFirst);
    restore(prisma.patientPackage, 'create', originalPatientPackageCreate);
    restore(commissionService, 'calculateCommissions', originalCalculateCommissions);
    restore(emailService, 'sendInvoiceEmail', originalSendInvoiceEmail);
  }
});

test('stripe-backed refund updates local ledger and restocks inventory', async () => {
  const originalPaymentFindFirst = prisma.payment.findFirst;
  const originalInvoiceFindUnique = prisma.invoice.findUnique;
  const originalUsageCount = prisma.packageSessionUsage.count;
  const originalStripeRefundCreate = stripe.refunds.create;
  const originalTransaction = prisma.$transaction;
  const originalLogAudit = auditService.logAudit;

  let invoiceCancelled = false;
  let originalPaymentRefunded = false;
  let refundRowCreated = false;
  let inventoryRestocked = false;
  let packageCancelled = false;
  let commissionsCancelled = false;

  try {
    let refundLookup = false;
    (prisma.payment.findFirst as any) = async ({ where }: any) => {
      if (where?.refundForPaymentId) {
        refundLookup = true;
        return null;
      }
      return {
        id: 'payment-1',
        clinicId: 'clinic-1',
        providerId: null,
        invoiceId: 'invoice-1',
        appointmentId: null,
        patientId: 'patient-1',
        amount: { mul: (n: number) => -120 * Math.abs(n) },
        status: 'PAID',
        stripePaymentIntentId: 'pi_paid_1',
      };
    };
    (prisma.invoice.findUnique as any) = async () => ({
      id: 'invoice-1',
      items: [{ id: 'item-1', productId: 'product-1', quantity: 2 }],
    });
    (prisma.packageSessionUsage.count as any) = async () => 0;
    (stripe.refunds.create as any) = async ({ payment_intent }: any) => {
      assert.equal(payment_intent, 'pi_paid_1');
      return { id: 're_1' };
    };
    (prisma.$transaction as any) = async (callback: (tx: any) => Promise<any>) =>
      callback({
        payment: {
          create: async () => {
            refundRowCreated = true;
            return { id: 'refund-1', amount: -120 };
          },
          update: async () => {
            originalPaymentRefunded = true;
            return { id: 'payment-1' };
          },
        },
        appointment: {
          update: async () => null,
        },
        invoice: {
          update: async () => {
            invoiceCancelled = true;
            return { id: 'invoice-1' };
          },
        },
        commissionRecord: {
          updateMany: async () => {
            commissionsCancelled = true;
            return { count: 1 };
          },
        },
        invoiceItem: {
          findMany: async () => [{ productId: 'product-1', quantity: 2 }],
        },
        inventoryItem: {
          updateMany: async () => {
            inventoryRestocked = true;
            return { count: 1 };
          },
        },
        patientPackage: {
          updateMany: async () => {
            packageCancelled = true;
            return { count: 1 };
          },
        },
      });
    (auditService.logAudit as any) = async () => {};

    const result = await paymentService.refundPayment('payment-1', 'user-1', {
      clinicId: 'clinic-1',
    });

    assert.equal(refundLookup, true);
    assert.equal(refundRowCreated, true);
    assert.equal(originalPaymentRefunded, true);
    assert.equal(invoiceCancelled, true);
    assert.equal(inventoryRestocked, true);
    assert.equal(packageCancelled, true);
    assert.equal(commissionsCancelled, true);
    assert.equal((result.refund as any).id, 'refund-1');
  } finally {
    restore(prisma.payment, 'findFirst', originalPaymentFindFirst);
    restore(prisma.invoice, 'findUnique', originalInvoiceFindUnique);
    restore(prisma.packageSessionUsage, 'count', originalUsageCount);
    restore(stripe.refunds, 'create', originalStripeRefundCreate);
    restore(prisma, '$transaction', originalTransaction);
    restore(auditService, 'logAudit', originalLogAudit);
  }
});

test('duplicate refund is rejected safely', async () => {
  const originalPaymentFindFirst = prisma.payment.findFirst;

  try {
    let callCount = 0;
    (prisma.payment.findFirst as any) = async ({ where }: any) => {
      callCount += 1;
      if (where?.refundForPaymentId) {
        return { id: 'refund-existing', status: 'REFUNDED' };
      }
      return {
        id: 'payment-1',
        clinicId: 'clinic-1',
        patientId: 'patient-1',
        amount: 100,
        status: 'PAID',
        stripePaymentIntentId: 'pi_1',
      };
    };

    await assert.rejects(
      () => paymentService.refundPayment('payment-1', 'user-1', { clinicId: 'clinic-1' }),
      (err: any) => err?.code === 'already_refunded' && err?.statusCode === 400
    );
    assert.equal(callCount >= 2, true);
  } finally {
    restore(prisma.payment, 'findFirst', originalPaymentFindFirst);
  }
});

test('appointment controller forwards patientPackageId into booking context', async () => {
  const originalCreateAppointment = appointmentService.createAppointment;

  let receivedContext: any = null;

  try {
    (appointmentService.createAppointment as any) = async (
      _data: any,
      _clinicId: string,
      context: any
    ) => {
      receivedContext = context;
      return { appointment: { id: 'appointment-1' } };
    };

    const req: any = {
      clinicId: 'clinic-1',
      body: {
        providerId: 'provider-1',
        serviceId: 'service-1',
        startTime: '2026-03-12T10:00:00.000Z',
        endTime: '2026-03-12T10:30:00.000Z',
        patientPackageId: 'package-use-1',
      },
      user: {
        id: 'patient-1',
        role: 'PATIENT',
      },
    };
    const res: any = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json() {
        return this;
      },
    };

    await appointmentController.create(req, res, () => {});
    assert.equal(receivedContext?.patientPackageId, 'package-use-1');
  } finally {
    restore(appointmentService, 'createAppointment', originalCreateAppointment);
  }
});

test('commission creation happens once per paid invoice item', async () => {
  const originalInvoiceFindUnique = prisma.invoice.findUnique;
  const originalRulesFindMany = prisma.commissionRule.findMany;
  const originalRecordFindFirst = prisma.commissionRecord.findFirst;
  const originalRecordCreate = prisma.commissionRecord.create;

  let createCount = 0;

  try {
    (prisma.invoice.findUnique as any) = async () => ({
      id: 'invoice-1',
      clinicId: 'clinic-1',
      status: 'PAID',
      items: [
        {
          id: 'item-1',
          providerId: 'provider-1',
          serviceId: 'service-1',
          productId: null,
          packageId: null,
          totalPrice: 100,
        },
      ],
    });
    (prisma.commissionRule.findMany as any) = async () => [
      {
        id: 'rule-1',
        clinicId: 'clinic-1',
        providerId: 'provider-1',
        serviceId: 'service-1',
        productId: null,
        packageId: null,
        itemType: 'ALL',
        commissionType: 'PERCENTAGE',
        commissionValue: 10,
      },
    ];
    (prisma.commissionRecord.findFirst as any) = async () =>
      createCount > 0 ? { id: 'existing' } : null;
    (prisma.commissionRecord.create as any) = async () => {
      createCount += 1;
      return { id: 'record-1' };
    };

    await commissionService.calculateCommissions('invoice-1');
    await commissionService.calculateCommissions('invoice-1');

    assert.equal(createCount, 1);
  } finally {
    restore(prisma.invoice, 'findUnique', originalInvoiceFindUnique);
    restore(prisma.commissionRule, 'findMany', originalRulesFindMany);
    restore(prisma.commissionRecord, 'findFirst', originalRecordFindFirst);
    restore(prisma.commissionRecord, 'create', originalRecordCreate);
  }
});
