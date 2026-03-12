import prisma from '../config/prisma';
import { ApiError } from '../types/errors';
import { CartItemType, CartStatus, Prisma } from '@prisma/client';

import stripe from '../config/stripe';
import { recalculateInvoiceTotals } from './invoiceService';

export const getOrCreateCart = async (clinicId: string, patientId: string) => {
  let cart = await prisma.cart.findFirst({
    where: { clinicId, patientId, status: 'ACTIVE' },
    include: {
      items: {
        include: { service: true, product: true, package: true, membership: true },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { clinicId, patientId, status: 'ACTIVE' },
      include: {
        items: {
          include: { service: true, product: true, package: true, membership: true },
        },
      },
    });
  }

  return cart;
};

export interface AddCartItemInput {
  itemType: CartItemType;
  itemId: string; // ID of the service, product, package, etc.
  quantity?: number;
  appointmentId?: string; // Optional if booking a service concurrently
}

export const addToCart = async (clinicId: string, patientId: string, input: AddCartItemInput) => {
  const cart = await getOrCreateCart(clinicId, patientId);

  let unitPrice = new Prisma.Decimal(0);
  
  if (input.itemType === 'PRODUCT') {
    const product = await prisma.product.findUnique({ where: { id: input.itemId } });
    if (!product) {
      const err = new Error('Product not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    unitPrice = product.price;
  } else if (input.itemType === 'SERVICE') {
    const service = await prisma.service.findUnique({ where: { id: input.itemId } });
    if (!service) {
      const err = new Error('Service not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    unitPrice = service.defaultPrice;
  } else if (input.itemType === 'PACKAGE') {
    const pkg = await prisma.package.findUnique({ where: { id: input.itemId } });
    if (!pkg) {
      const err = new Error('Package not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    unitPrice = pkg.price;
  } else if (input.itemType === 'MEMBERSHIP') {
    const membership = await prisma.membership.findUnique({ where: { id: input.itemId } });
    if (!membership) {
      const err = new Error('Membership not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    unitPrice = membership.monthlyPrice;
  }

  // Check if item already exists in cart (based on itemId)
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      itemType: input.itemType,
      ...(input.itemType === 'PRODUCT' ? { productId: input.itemId } : {}),
      ...(input.itemType === 'SERVICE' ? { serviceId: input.itemId } : {}),
      ...(input.itemType === 'PACKAGE' ? { packageId: input.itemId } : {}),
      ...(input.itemType === 'MEMBERSHIP' ? { membershipId: input.itemId } : {}),
    }
  });

  if (existingItem) {
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + (input.quantity || 1) },
    });
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      itemType: input.itemType,
      quantity: input.quantity || 1,
      unitPrice,
      productId: input.itemType === 'PRODUCT' ? input.itemId : null,
      serviceId: input.itemType === 'SERVICE' ? input.itemId : null,
      packageId: input.itemType === 'PACKAGE' ? input.itemId : null,
      membershipId: input.itemType === 'MEMBERSHIP' ? input.itemId : null,
      appointmentId: input.appointmentId,
    },
  });
};

export const updateCartItem = async (cartId: string, itemId: string, quantity: number) => {
  if (quantity <= 0) {
    return prisma.cartItem.delete({ where: { id: itemId } });
  }

  return prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });
};

export const removeCartItem = async (cartId: string, itemId: string) => {
  return prisma.cartItem.delete({ where: { id: itemId } });
};

export const clearCart = async (cartId: string) => {
  return prisma.cartItem.deleteMany({ where: { cartId } });
};

export const checkoutCart = async (clinicId: string, patientId: string) => {
  const cart = await prisma.cart.findFirst({
    where: { clinicId, patientId, status: 'ACTIVE' },
    include: { items: true },
  });

  if (!cart || cart.items.length === 0) {
    const err = new Error('Cart is empty or not found') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  let totalAmount = new Prisma.Decimal(0);
  for (const item of cart.items) {
    totalAmount = totalAmount.plus(item.unitPrice.times(item.quantity));
  }

  // Create an invoice from the cart
  const invoice = await prisma.invoice.create({
    data: {
      clinicId,
      patientId,
      providerId: 'PENDING_ASSIGNMENT', // Typically we might want to attach a provider here if available
      status: 'DRAFT',
      subtotal: totalAmount,
      taxAmount: 0,
      totalAmount,
      items: {
        create: cart.items.map(item => ({
          serviceId: item.serviceId,
          productId: item.productId,
          packageId: item.packageId,
          membershipId: item.membershipId,
          description: `Cart Item: ${item.itemType}`,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.unitPrice.times(item.quantity),
        })),
      },
    },
  });

  // Calculate tax and update invoice totals
  await recalculateInvoiceTotals(invoice.id);

  // Re-fetch invoice to get updated amounts for Stripe
  const updatedInvoice = await prisma.invoice.findUnique({
    where: { id: invoice.id },
  });

  if (!updatedInvoice) throw new Error('Failed to retrieve updated invoice');

  // Convert to cents for Stripe
  const amountInCents = Math.round(updatedInvoice.totalAmount.toNumber() * 100);

  let clientSecret: string | undefined = undefined;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: { 
        cartId: cart.id, 
        invoiceId: updatedInvoice.id,
        clinicId,
        patientId,
        type: 'CART_CHECKOUT'
      },
    });
    clientSecret = paymentIntent.client_secret ?? undefined;
  } catch (err) {
    console.error('Stripe Cart PaymentIntent Error:', err);
  }

  await prisma.cart.update({
    where: { id: cart.id },
    data: { status: 'CHECKED_OUT' },
  });

  return {
    invoice: updatedInvoice,
    clientSecret,
  };
};
