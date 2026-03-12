import prisma from '../config/prisma';
import { ApiError } from '../types/errors';

export const getMemberships = async (clinicId: string) => {
  return prisma.membership.findMany({
    where: { clinicId, isActive: true },
  });
};

export const getMembershipById = async (id: string, clinicId: string) => {
  const membership = await prisma.membership.findFirst({
    where: { id, clinicId },
  });

  if (!membership) {
    const err = new Error('Membership not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  return membership;
};

export interface CreateMembershipInput {
  name: string;
  description?: string;
  monthlyPrice: number;
  billingPeriod?: string;
}

export const createMembership = async (clinicId: string, input: CreateMembershipInput) => {
  return prisma.membership.create({
    data: {
      clinicId,
      name: input.name,
      description: input.description,
      monthlyPrice: input.monthlyPrice,
      billingPeriod: input.billingPeriod ?? 'MONTHLY',
    },
  });
};

export interface UpdateMembershipInput {
  name?: string;
  description?: string;
  monthlyPrice?: number;
  billingPeriod?: string;
  isActive?: boolean;
}

export const updateMembership = async (id: string, clinicId: string, input: UpdateMembershipInput) => {
  const existing = await prisma.membership.findFirst({
    where: { id, clinicId },
  });

  if (!existing) {
    const err = new Error('Membership not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  return prisma.membership.update({
    where: { id },
    data: input,
  });
};

export const deleteMembership = async (id: string, clinicId: string) => {
  const existing = await prisma.membership.findFirst({
    where: { id, clinicId },
  });

  if (!existing) {
    const err = new Error('Membership not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  return prisma.membership.update({
    where: { id },
    data: { isActive: false },
  });
};
