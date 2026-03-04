import prisma from '../config/prisma';
import { ApiError } from '../types/errors';
import * as auditService from './auditService';

export interface CreateProviderData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  disciplineId: string;
  userId?: string | null;
  serviceIds?: string[];
}

type ClinicWhere = { clinicId?: string } | Record<string, never>;

const validateDisciplineBelongsToClinic = async (
  disciplineId: string,
  clinicId: string
) => {
  const discipline = await prisma.discipline.findFirst({
    where: { id: disciplineId, clinicId },
  });
  if (!discipline) {
    const err = new Error(
      'Discipline not found or does not belong to this clinic'
    ) as ApiError;
    err.statusCode = 404;
    throw err;
  }
  return discipline;
};

const validateUserBelongsToClinic = async (
  userId: string,
  clinicId: string
) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, clinicId },
  });
  if (!user) {
    const err = new Error(
      'User not found or does not belong to this clinic'
    ) as ApiError;
    err.statusCode = 404;
    throw err;
  }
  return user;
};

const checkDuplicateProviderUserLink = async (userId: string) => {
  const existing = await prisma.provider.findFirst({
    where: { userId },
  });
  if (existing) {
    const err = new Error('User is already linked to another provider') as ApiError;
    err.statusCode = 409;
    throw err;
  }
};

const validateServiceBelongsToClinic = async (
  serviceId: string,
  clinicId: string
) => {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, clinicId, isActive: true },
  });
  if (!service) {
    const err = new Error(
      'Service not found or does not belong to this clinic'
    ) as ApiError;
    err.statusCode = 404;
    throw err;
  }
  return service;
};

export const createProvider = async (
  data: CreateProviderData,
  clinicId: string
) => {
  await validateDisciplineBelongsToClinic(data.disciplineId, clinicId);

  if (data.userId) {
    await validateUserBelongsToClinic(data.userId, clinicId);
    await checkDuplicateProviderUserLink(data.userId);
  }

  const hasServices =
    data.serviceIds && Array.isArray(data.serviceIds) && data.serviceIds.length > 0;

  const provider = await prisma.provider.create({
    data: {
      clinicId,
      userId: data.userId || null,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      disciplineId: data.disciplineId,
    },
    include: {
      discipline: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (hasServices && data.serviceIds) {
    for (const serviceId of data.serviceIds) {
      await validateServiceBelongsToClinic(serviceId, clinicId);
      await prisma.providerService.create({
        data: { providerId: provider.id, serviceId },
      });
    }
    return prisma.provider.findUnique({
      where: { id: provider.id },
      include: {
        discipline: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        providerServices: {
          include: {
            service: { include: { discipline: { select: { id: true, name: true } } } },
          },
        },
      },
    });
  }

  return provider;
};

export const getProviders = async (where: ClinicWhere) => {
  const whereClause = Object.keys(where).length === 0 ? { isActive: true } : { ...where, isActive: true };
  return prisma.provider.findMany({
    where: whereClause as { isActive: boolean; clinicId?: string },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      discipline: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
      providerServices: {
        include: {
          service: { select: { id: true, name: true, defaultPrice: true } },
        },
      },
    },
  });
};

export const getProviderById = async (
  id: string,
  where: ClinicWhere = {}
) => {
  const whereClause = Object.keys(where).length === 0 ? { id } : { id, ...where };
  return prisma.provider.findFirst({
    where: whereClause as { id: string; clinicId?: string },
    include: {
      discipline: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
      providerAvailability: true,
    },
  });
};

export const updateProvider = async (
  id: string,
  data: Partial<CreateProviderData & { isActive?: boolean }>,
  where: ClinicWhere
) => {
  const provider = await getProviderById(id, where);
  if (!provider) {
    const err = new Error('Provider not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  const clinicId = 'clinicId' in where ? where.clinicId : undefined;

  if (data.disciplineId && clinicId) {
    await validateDisciplineBelongsToClinic(data.disciplineId, clinicId);
  }

  if (data.userId !== undefined) {
    if (data.userId && provider.clinicId) {
      await validateUserBelongsToClinic(data.userId, provider.clinicId);
      if (data.userId !== provider.userId) {
        await checkDuplicateProviderUserLink(data.userId);
      }
    }
  }

  if (data.isActive === false && provider.isActive) {
    const futureCount = await prisma.appointment.count({
      where: {
        providerId: id,
        startTime: { gt: new Date() },
        status: { notIn: ['CANCELLED'] },
      },
    });
    if (futureCount > 0) {
      const err = new Error(
        'Cannot deactivate provider with future appointments. Reassign or cancel them first.'
      ) as ApiError;
      err.statusCode = 400;
      throw err;
    }
  }

  return prisma.provider.update({
    where: { id },
    data: {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.disciplineId && { disciplineId: data.disciplineId }),
      ...(data.userId !== undefined && { userId: data.userId || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      discipline: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

export const softDeleteProvider = async (id: string, where: ClinicWhere) => {
  const provider = await getProviderById(id, where);
  if (!provider) {
    const err = new Error('Provider not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  const futureCount = await prisma.appointment.count({
    where: {
      providerId: id,
      startTime: { gt: new Date() },
      status: { notIn: ['CANCELLED'] },
    },
  });
  if (futureCount > 0) {
    const err = new Error(
      'Cannot deactivate provider with future appointments. Reassign or cancel them first.'
    ) as ApiError;
    err.statusCode = 400;
    throw err;
  }

  return prisma.provider.update({
    where: { id },
    data: { isActive: false },
    include: {
      discipline: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

export const addProviderService = async (
  providerId: string,
  serviceId: string,
  priceOverride: number | string | null | undefined,
  clinicId: string
) => {
  const provider = await getProviderById(providerId, { clinicId });
  if (!provider) {
    const err = new Error('Provider not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  await validateServiceBelongsToClinic(serviceId, clinicId);

  const existing = await prisma.providerService.findFirst({
    where: { providerId, serviceId },
  });
  if (existing) {
    const err = new Error('Provider already has this service assigned') as ApiError;
    err.statusCode = 409;
    throw err;
  }

  return prisma.providerService.create({
    data: {
      providerId,
      serviceId,
      priceOverride: priceOverride ?? null,
    },
    include: {
      service: {
        include: { discipline: { select: { id: true, name: true } } },
      },
    },
  });
};

export const updateProviderService = async (
  providerId: string,
  serviceId: string,
  priceOverride: number | string | null | undefined,
  clinicId: string,
  performedById: string
) => {
  const provider = await getProviderById(providerId, { clinicId });
  if (!provider) {
    const err = new Error('Provider not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  await validateServiceBelongsToClinic(serviceId, clinicId);

  const existing = await prisma.providerService.findFirst({
    where: { providerId, serviceId },
  });
  if (!existing) {
    const err = new Error('Provider service assignment not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  const newPrice = priceOverride ?? null;
  const oldStr = existing.priceOverride?.toString() ?? null;
  const newStr = newPrice != null ? String(newPrice) : null;

  const updated = await prisma.providerService.update({
    where: { id: existing.id },
    data: { priceOverride: newPrice },
    include: {
      service: {
        include: { discipline: { select: { id: true, name: true } } },
      },
    },
  });

  if (oldStr !== newStr) {
    await auditService.logAudit({
      clinicId,
      entityType: 'ProviderService',
      entityId: existing.id,
      action: 'UPDATE',
      fieldChanged: 'priceOverride',
      oldValue: oldStr,
      newValue: newStr,
      performedById,
    });
  }

  return updated;
};

export const removeProviderService = async (
  providerId: string,
  serviceId: string,
  clinicId: string
) => {
  const provider = await getProviderById(providerId, { clinicId });
  if (!provider) {
    const err = new Error('Provider not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  const count = await prisma.providerService.count({
    where: { providerId },
  });
  if (count <= 1) {
    const err = new Error('Provider must have at least one service') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.providerService.findFirst({
    where: { providerId, serviceId },
  });
  if (!existing) {
    const err = new Error('Provider service assignment not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  return prisma.providerService.delete({
    where: { id: existing.id },
  });
};

export const getProviderServices = async (
  providerId: string,
  clinicId: string
) => {
  const provider = await getProviderById(providerId, { clinicId });
  if (!provider) {
    const err = new Error('Provider not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  return prisma.providerService.findMany({
    where: { providerId },
    include: {
      service: {
        include: { discipline: { select: { id: true, name: true } } },
      },
    },
  });
};
