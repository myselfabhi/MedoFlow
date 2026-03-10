import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { ApiError } from '../types/errors';
import * as auditService from './auditService';
import * as passwordSetupService from './passwordSetupService';
import * as emailService from './emailService';

export interface CreateProviderServiceInput {
  serviceId: string;
  priceOverride?: number;
}

export interface CreateProviderData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  disciplineIds: string[];
  userId?: string | null;
  serviceIds?: string[];
  /** Services with optional price override (takes precedence over serviceIds) */
  services?: CreateProviderServiceInput[];
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
  const email = (data.email ?? '').trim();
  if (!email) {
    const err = new Error('Valid email is required.') as ApiError;
    err.statusCode = 400;
    throw err;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const err = new Error('Valid email is required.') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingUser) {
    const err = new Error('A provider with this email already exists.') as ApiError;
    err.statusCode = 409;
    throw err;
  }

  if (!data.disciplineIds?.length) {
    const err = new Error('At least one discipline is required') as ApiError;
    err.statusCode = 400;
    throw err;
  }
  for (const disciplineId of data.disciplineIds) {
    await validateDisciplineBelongsToClinic(disciplineId, clinicId);
  }

  const servicesInput: CreateProviderServiceInput[] =
    data.services && data.services.length > 0
      ? data.services
      : (data.serviceIds?.map((id) => ({ serviceId: id })) ?? []);

  if (servicesInput.length === 0) {
    const err = new Error('Provider must offer at least one service.') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const providerName = `${data.firstName} ${data.lastName}`.trim();
  const tempPassword = 'pending-setup';
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: providerName,
      password: hashedPassword,
      role: 'PROVIDER',
      clinicId,
    },
    select: { id: true },
  });

  const token = await passwordSetupService.createPasswordSetupToken(user.id);
  const frontendUrl = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const setupLink = `${frontendUrl}/set-password?token=${token}`;
  await emailService.sendProviderInviteEmail(email, providerName, setupLink);

  const provider = await prisma.provider.create({
    data: {
      clinicId,
      userId: user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email,
      phone: data.phone,
      disciplines: {
        create: data.disciplineIds.map((disciplineId) => ({ disciplineId })),
      },
    },
    include: {
      disciplines: { include: { discipline: { select: { id: true, name: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  for (const item of servicesInput) {
      const { serviceId, priceOverride } = item;
      await validateServiceBelongsToClinic(serviceId, clinicId);
      await prisma.providerService.create({
        data: {
          providerId: provider.id,
          serviceId,
          priceOverride: priceOverride ?? null,
        },
      });
  }
  return prisma.provider.findUnique({
      where: { id: provider.id },
      include: {
        disciplines: { include: { discipline: { select: { id: true, name: true } } } },
        user: { select: { id: true, name: true, email: true } },
        providerServices: {
          include: {
            service: { include: { discipline: { select: { id: true, name: true } } } },
          },
        },
      },
    });
};

export const getProviders = async (where: ClinicWhere) => {
  const whereClause = Object.keys(where).length === 0 ? { isActive: true } : { ...where, isActive: true };
  return prisma.provider.findMany({
    where: whereClause as { isActive: boolean; clinicId?: string },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      disciplines: { include: { discipline: { select: { id: true, name: true } } } },
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
      disciplines: { include: { discipline: { select: { id: true, name: true } } } },
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

  if (data.disciplineIds && data.disciplineIds.length > 0 && clinicId) {
    for (const disciplineId of data.disciplineIds) {
      await validateDisciplineBelongsToClinic(disciplineId, clinicId);
    }
  }

  if (data.userId !== undefined) {
    if (data.userId && provider.clinicId) {
      await validateUserBelongsToClinic(data.userId, provider.clinicId);
      if (data.userId !== provider.userId) {
        await checkDuplicateProviderUserLink(data.userId);
      }
    }
  }

  // PRD: Block booking when provider inactive. Return affected appointments for admin reassignment UI.
  if (data.isActive === false && provider.isActive) {
    const affected = await prisma.appointment.findMany({
      where: {
        providerId: id,
        startTime: { gt: new Date() },
        status: { notIn: ['CANCELLED', 'RESCHEDULED'] },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        patientId: true,
        serviceId: true,
        locationId: true,
      },
      orderBy: { startTime: 'asc' },
    });
    if (affected.length > 0) {
      const err = new Error(
        'Cannot deactivate provider with future appointments. Reassign or cancel them first.'
      ) as ApiError;
      err.statusCode = 400;
      err.affectedAppointments = affected;
      throw err;
    }
  }

  const baseData: Record<string, unknown> = {
    ...(data.firstName && { firstName: data.firstName }),
    ...(data.lastName && { lastName: data.lastName }),
    ...(data.email !== undefined && { email: data.email }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.userId !== undefined && { userId: data.userId || null }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
  };

  if (data.disciplineIds && data.disciplineIds.length > 0) {
    await prisma.providerDiscipline.deleteMany({ where: { providerId: id } });
    (baseData as { disciplines?: { create: { disciplineId: string }[] } }).disciplines = {
      create: data.disciplineIds.map((disciplineId) => ({ disciplineId })),
    };
  }

  const updatedProvider = await prisma.provider.update({
    where: { id },
    data: baseData as Parameters<typeof prisma.provider.update>[0]['data'],
    include: {
      disciplines: { include: { discipline: { select: { id: true, name: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (data.isActive !== undefined && provider.userId) {
    await prisma.user.update({
      where: { id: provider.userId },
      data: { isActive: data.isActive },
    });
  }

  return updatedProvider;
};

export const softDeleteProvider = async (
  id: string,
  where: ClinicWhere,
  performedById: string
) => {
  const provider = await getProviderById(id, where);
  if (!provider) {
    const err = new Error('Provider not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  const affected = await prisma.appointment.findMany({
    where: {
      providerId: id,
      startTime: { gt: new Date() },
      status: { notIn: ['CANCELLED', 'RESCHEDULED'] },
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      patientId: true,
      serviceId: true,
      locationId: true,
    },
    orderBy: { startTime: 'asc' },
  });
  if (affected.length > 0) {
    const err = new Error(
      'Cannot deactivate provider with future appointments. Reassign or cancel them first.'
    ) as ApiError;
    err.statusCode = 400;
    err.affectedAppointments = affected;
    throw err;
  }

  const updated = await prisma.provider.update({
    where: { id },
    data: { isActive: false },
    include: {
      disciplines: { include: { discipline: { select: { id: true, name: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (provider.userId) {
    await prisma.user.update({
      where: { id: provider.userId },
      data: { isActive: false },
    });
  }

  await auditService.logAudit({
    clinicId: provider.clinicId,
    entityType: 'Provider',
    entityId: id,
    action: 'ARCHIVE',
    fieldChanged: 'isActive',
    oldValue: true,
    newValue: false,
    performedById,
  });

  if (provider.userId) {
    await auditService.logAudit({
      clinicId: provider.clinicId,
      entityType: 'User',
      entityId: provider.userId,
      action: 'DEACTIVATE',
      fieldChanged: 'isActive',
      oldValue: true,
      newValue: false,
      performedById,
    });
  }

  return updated;
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
