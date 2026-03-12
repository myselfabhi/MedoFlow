import prisma from '../config/prisma';
import { ApiError } from '../types/errors';

export const getPackages = async (clinicId: string) => {
  return prisma.package.findMany({
    where: { clinicId, isActive: true },
  });
};

export const getPackageById = async (id: string, clinicId: string) => {
  const pkg = await prisma.package.findFirst({
    where: { id, clinicId },
  });

  if (!pkg) {
    const err = new Error('Package not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  return pkg;
};

export interface CreatePackageInput {
  name: string;
  description?: string;
  price: number;
  totalSessions?: number;
  expiresInDays?: number;
}

export const createPackage = async (clinicId: string, input: CreatePackageInput) => {
  return prisma.package.create({
    data: {
      clinicId,
      name: input.name,
      description: input.description,
      price: input.price,
      totalSessions: input.totalSessions,
      expiresInDays: input.expiresInDays,
    },
  });
};

export interface UpdatePackageInput {
  name?: string;
  description?: string;
  price?: number;
  totalSessions?: number;
  expiresInDays?: number;
  isActive?: boolean;
}

export const updatePackage = async (id: string, clinicId: string, input: UpdatePackageInput) => {
  const existing = await prisma.package.findFirst({
    where: { id, clinicId },
  });

  if (!existing) {
    const err = new Error('Package not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  return prisma.package.update({
    where: { id },
    data: input,
  });
};

export const deletePackage = async (id: string, clinicId: string) => {
  const existing = await prisma.package.findFirst({
    where: { id, clinicId },
  });

  if (!existing) {
    const err = new Error('Package not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  return prisma.package.update({
    where: { id },
    data: { isActive: false },
  });
};
