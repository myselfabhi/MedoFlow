import prisma from '../config/prisma';
import { ApiError } from '../types/errors';
import { Prisma } from '@prisma/client';
import * as auditService from './auditService';

const DEFAULT_TAX_RATE = 0.13; // 13% - configurable via env if needed

const ZERO = new Prisma.Decimal(0);

export const createInvoice = async (
  appointmentId: string,
  clinicId: string,
  providerId: string,
  performedById: string
) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, clinicId, providerId },
    include: { patient: true },
  });

  if (!appointment) {
    const err = new Error(
      'Appointment not found or does not belong to this clinic/provider'
    ) as ApiError;
    err.statusCode = 404;
    throw err;
  }

  const existing = await prisma.invoice.findFirst({
    where: { appointmentId, clinicId, status: { not: 'CANCELLED' } },
  });

  if (existing) {
    const err = new Error(
      'An active invoice already exists for this appointment'
    ) as ApiError;
    err.statusCode = 409;
    throw err;
  }

  const invoice = await prisma.invoice.create({
    data: {
      clinicId,
      appointmentId,
      patientId: appointment.patientId,
      providerId,
      status: 'DRAFT',
      subtotal: ZERO,
      taxAmount: ZERO,
      totalAmount: ZERO,
    },
    include: {
      items: { include: { service: true } },
      appointment: true,
      patient: true,
      provider: true,
    },
  });

  await auditService.logAudit({
    clinicId,
    entityType: 'Invoice',
    entityId: invoice.id,
    action: 'INVOICE_CREATED',
    newValue: { appointmentId, providerId },
    performedById,
  });

  return invoice;
};

export interface AddInvoiceItemInput {
  serviceId: string;
  description: string;
  unitPrice: number | string | Prisma.Decimal;
  quantity?: number;
}

export const addInvoiceItem = async (
  invoiceId: string,
  input: AddInvoiceItemInput,
  performedById: string
) => {
  const { serviceId, description, unitPrice, quantity = 1 } = input;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId },
    include: {
      items: { include: { service: true } },
      provider: {
        include: {
          providerServices: {
            where: { serviceId },
            include: { service: true },
          },
        },
      },
    },
  });

  if (!invoice) {
    const err = new Error('Invoice not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  if (invoice.status !== 'DRAFT') {
    const err = new Error(
      'Cannot add items to a finalized or paid invoice'
    ) as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, clinicId: invoice.clinicId },
  });

  if (!service) {
    const err = new Error(
      'Service not found or does not belong to this clinic'
    ) as ApiError;
    err.statusCode = 404;
    throw err;
  }

  const providerService = invoice.provider.providerServices[0];
  const expectedPrice =
    providerService?.priceOverride ?? service.defaultPrice;

  const unitPriceDecimal =
    typeof unitPrice === 'object' && 'toNumber' in unitPrice
      ? unitPrice
      : new Prisma.Decimal(unitPrice);

  const priceDiffers =
    unitPriceDecimal.toDecimalPlaces(2).toString() !==
    new Prisma.Decimal(expectedPrice).toDecimalPlaces(2).toString();

  if (priceDiffers) {
    await auditService.logAudit({
      clinicId: invoice.clinicId,
      entityType: 'InvoiceItem',
      entityId: invoiceId,
      action: 'INVOICE_PRICE_OVERRIDE',
      fieldChanged: 'unitPrice',
      oldValue: Number(expectedPrice),
      newValue: Number(unitPriceDecimal),
      performedById,
    });
  }

  const qty = Math.max(1, Math.floor(quantity));
  const totalPrice = unitPriceDecimal.times(qty);

  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.invoiceItem.create({
      data: {
        invoiceId,
        serviceId,
        description,
        unitPrice: unitPriceDecimal,
        quantity: qty,
        totalPrice,
      },
      include: { service: true },
    });

    await recalculateInvoiceTotalsTx(tx, invoiceId);

    return created;
  });

  return item;
};

export interface UpdateInvoiceItemInput {
  unitPrice?: number | string | Prisma.Decimal;
  quantity?: number;
}

export const updateInvoiceItem = async (
  invoiceId: string,
  itemId: string,
  input: UpdateInvoiceItemInput,
  performedById: string
) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId },
    include: {
      items: { where: { id: itemId }, include: { service: true } },
      provider: {
        include: {
          providerServices: {
            include: { service: true },
          },
        },
      },
    },
  });

  if (!invoice) {
    const err = new Error('Invoice not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  if (invoice.status !== 'DRAFT') {
    const err = new Error(
      'Cannot edit items on a finalized or paid invoice'
    ) as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const item = invoice.items[0];
  if (!item) {
    const err = new Error('Invoice item not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  const providerService = invoice.provider.providerServices.find(
    (ps) => ps.serviceId === item.serviceId
  );
  const expectedPrice =
    providerService?.priceOverride ?? item.service.defaultPrice;

  let unitPrice = item.unitPrice;
  let quantity = item.quantity;

  if (input.unitPrice !== undefined) {
    unitPrice =
      typeof input.unitPrice === 'object' && 'toNumber' in input.unitPrice
        ? input.unitPrice
        : new Prisma.Decimal(input.unitPrice);
    const priceDiffers =
      unitPrice.toDecimalPlaces(2).toString() !==
      new Prisma.Decimal(expectedPrice).toDecimalPlaces(2).toString();
    if (priceDiffers) {
      await auditService.logAudit({
        clinicId: invoice.clinicId,
        entityType: 'InvoiceItem',
        entityId: itemId,
        action: 'INVOICE_PRICE_OVERRIDE',
        fieldChanged: 'unitPrice',
        oldValue: Number(expectedPrice),
        newValue: Number(unitPrice),
        performedById,
      });
    }
  }

  if (input.quantity !== undefined) {
    quantity = Math.max(1, Math.floor(input.quantity));
  }

  const totalPrice =
    typeof unitPrice === 'object' && 'times' in unitPrice
      ? unitPrice.times(quantity)
      : new Prisma.Decimal(unitPrice).times(quantity);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.invoiceItem.update({
      where: { id: itemId },
      data: { unitPrice, quantity, totalPrice },
      include: { service: true },
    });
    await recalculateInvoiceTotalsTx(tx, invoiceId);
    return result;
  });

  return updated;
};

export const deleteInvoiceItem = async (
  invoiceId: string,
  itemId: string,
  performedById: string
) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId },
    include: { items: { where: { id: itemId } } },
  });

  if (!invoice) {
    const err = new Error('Invoice not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  if (invoice.status !== 'DRAFT') {
    const err = new Error(
      'Cannot delete items from a finalized or paid invoice'
    ) as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const item = invoice.items[0];
  if (!item) {
    const err = new Error('Invoice item not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.delete({ where: { id: itemId } });
    await recalculateInvoiceTotalsTx(tx, invoiceId);
  });

  return null;
};

async function recalculateInvoiceTotalsTx(
  tx: Omit<
    typeof prisma,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
  >,
  invoiceId: string
) {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: { include: { service: true } } },
  });

  if (!invoice) return;

  let subtotal = new Prisma.Decimal(0);
  let taxableAmount = new Prisma.Decimal(0);

  for (const item of invoice.items) {
    subtotal = subtotal.plus(item.totalPrice);
    if (item.service.taxApplicable) {
      taxableAmount = taxableAmount.plus(item.totalPrice);
    }
  }

  const taxAmount = taxableAmount.times(DEFAULT_TAX_RATE).toDecimalPlaces(2);
  const totalAmount = subtotal.plus(taxAmount).toDecimalPlaces(2);

  await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      subtotal: subtotal.toDecimalPlaces(2),
      taxAmount,
      totalAmount,
    },
  });
}

export const finalizeInvoice = async (
  invoiceId: string,
  clinicId: string,
  performedById: string
) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, clinicId },
    include: { items: true },
  });

  if (!invoice) {
    const err = new Error('Invoice not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  if (invoice.status !== 'DRAFT') {
    const err = new Error(
      `Invoice cannot be finalized (current status: ${invoice.status})`
    ) as ApiError;
    err.statusCode = 400;
    throw err;
  }

  if (invoice.items.length === 0) {
    const err = new Error(
      'Cannot finalize invoice with no items'
    ) as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'FINALIZED' },
    include: {
      items: { include: { service: true } },
      appointment: true,
      patient: true,
      provider: true,
    },
  });

  await auditService.logAudit({
    clinicId,
    entityType: 'Invoice',
    entityId: invoiceId,
    action: 'INVOICE_FINALIZED',
    oldValue: { status: 'DRAFT' },
    newValue: { status: 'FINALIZED', totalAmount: Number(updated.totalAmount) },
    performedById,
  });

  return updated;
};

export const payInvoice = async (
  invoiceId: string,
  clinicId: string,
  performedById: string
) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, clinicId },
  });

  if (!invoice) {
    const err = new Error('Invoice not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  if (invoice.status !== 'FINALIZED') {
    const err = new Error(
      `Invoice must be finalized before payment (current status: ${invoice.status})`
    ) as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'PAID' },
    include: {
      items: { include: { service: true } },
      appointment: true,
      patient: true,
      provider: true,
    },
  });

  await auditService.logAudit({
    clinicId,
    entityType: 'Invoice',
    entityId: invoiceId,
    action: 'INVOICE_PAID',
    oldValue: { status: 'FINALIZED' },
    newValue: { status: 'PAID', totalAmount: Number(updated.totalAmount) },
    performedById,
  });

  return updated;
};

export const getInvoiceById = async (
  id: string,
  clinicId?: string
) => {
  const where: { id: string; clinicId?: string } = { id };
  if (clinicId) where.clinicId = clinicId;

  return prisma.invoice.findFirst({
    where,
    include: {
      items: { include: { service: true } },
      appointment: true,
      patient: true,
      provider: true,
    },
  });
};

export const getInvoicesByClinic = async (
  clinicId: string,
  status?: string
) => {
  const where: Prisma.InvoiceWhereInput = { clinicId };
  if (status && status !== 'ALL') where.status = status as 'DRAFT' | 'FINALIZED' | 'PAID' | 'CANCELLED';

  return prisma.invoice.findMany({
    where,
    include: {
      items: true,
      patient: { select: { id: true, name: true, email: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      appointment: { select: { id: true, startTime: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getInvoicesByAppointment = async (
  appointmentId: string,
  clinicId: string
) => {
  return prisma.invoice.findMany({
    where: { appointmentId, clinicId },
    include: {
      items: { include: { service: true } },
      patient: true,
      provider: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};
