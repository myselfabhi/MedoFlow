import prisma from '../config/prisma';
import { ApiError } from '../types/errors';
import { CommissionType, CommissionItemType } from '@prisma/client';

export const getRules = async (clinicId: string) => {
  return prisma.commissionRule.findMany({
    where: { clinicId, isActive: true },
    include: { provider: true, service: true, product: true, package: true },
  });
};

export interface CreateRuleInput {
  providerId?: string;
  itemType: CommissionItemType;
  serviceId?: string;
  productId?: string;
  packageId?: string;
  commissionType: CommissionType;
  commissionValue: number;
}

export const createRule = async (clinicId: string, input: CreateRuleInput) => {
  return prisma.commissionRule.create({
    data: {
      clinicId,
      providerId: input.providerId,
      itemType: input.itemType,
      serviceId: input.serviceId,
      productId: input.productId,
      packageId: input.packageId,
      commissionType: input.commissionType,
      commissionValue: input.commissionValue,
    },
  });
};

export const updateRule = async (id: string, clinicId: string, isActive: boolean) => {
  return prisma.commissionRule.update({
    where: { id, clinicId },
    data: { isActive },
  });
};

export const getRecords = async (clinicId: string, providerId?: string) => {
  return prisma.commissionRecord.findMany({
    where: {
      clinicId,
      ...(providerId ? { providerId } : {})
    },
    include: {
      provider: true,
      invoiceItem: {
        include: { service: true, product: true, package: true }
      },
      invoice: true
    },
    orderBy: { earnedAt: 'desc' }
  });
};

export const markPaid = async (clinicId: string, recordIds: string[]) => {
  return prisma.commissionRecord.updateMany({
    where: {
      clinicId,
      id: { in: recordIds },
      status: 'PENDING'
    },
    data: {
      status: 'PAID',
      paidOutAt: new Date()
    }
  });
};

export const calculateCommissions = async (invoiceId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true, clinic: true }
  });

  if (!invoice || invoice.status !== 'PAID') return;

  const rules = await prisma.commissionRule.findMany({
    where: { clinicId: invoice.clinicId, isActive: true }
  });

  for (const item of invoice.items) {
    if (!item.providerId) continue;

    const existingRecord = await prisma.commissionRecord.findFirst({
      where: { invoiceItemId: item.id },
      select: { id: true },
    });
    if (existingRecord) continue;

    // Find the best matching rule
    // Priority: Provider + Item specific > Provider + ItemType > Global + Item specific > Global + ItemType
    const matchingRule = rules.find(r => 
      r.providerId === item.providerId && 
      ((item.serviceId && r.serviceId === item.serviceId) || (item.productId && r.productId === item.productId) || (item.packageId && r.packageId === item.packageId))
    ) || rules.find(r => 
      r.providerId === item.providerId && r.itemType === 'ALL'
    ) || rules.find(r => 
      !r.providerId && 
      ((item.serviceId && r.serviceId === item.serviceId) || (item.productId && r.productId === item.productId) || (item.packageId && r.packageId === item.packageId))
    ) || rules.find(r => 
      !r.providerId && r.itemType === 'ALL'
    );

    if (matchingRule) {
      let amount = 0;
      const basis = Number(item.totalPrice);
      
      if (matchingRule.commissionType === 'PERCENTAGE') {
        amount = (basis * Number(matchingRule.commissionValue)) / 100;
      } else {
        amount = Number(matchingRule.commissionValue);
      }

      await prisma.commissionRecord.create({
        data: {
          clinicId: invoice.clinicId,
          providerId: item.providerId,
          invoiceId: invoice.id,
          invoiceItemId: item.id,
          ruleId: matchingRule.id,
          basisAmount: basis,
          amount: amount,
          status: 'PENDING',
          earnedAt: new Date()
        }
      });
    }
  }
};
