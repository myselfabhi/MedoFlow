import prisma from '../config/prisma';
import { Clinic } from '@prisma/client';
import { ApiError } from '../types/errors';
import * as auditService from './auditService';

export interface CreateClinicData {
  name: string;
  email: string;
  subscriptionPlan?: string;
}

export interface UpdateClinicData {
  name?: string;
  email?: string;
  subscriptionPlan?: string;
}

export interface UpsertLaunchLocationData {
  id?: string;
  name: string;
  address?: string;
  timezone: string;
}

export const createClinic = async (
  data: CreateClinicData
): Promise<Clinic> => {
  return prisma.clinic.create({
    data: {
      name: data.name,
      email: data.email,
      subscriptionPlan: data.subscriptionPlan || 'free',
    },
  });
};

export const getClinicById = async (id: string) => {
  return prisma.clinic.findUnique({
    where: { id },
  });
};

export const clinicExists = async (id: string): Promise<boolean> => {
  const clinic = await prisma.clinic.findUnique({
    where: { id },
    select: { id: true },
  });
  return !!clinic;
};

export const getClinicForUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { clinicId: true, role: true },
  });

  if (!user?.clinicId) {
    return null;
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: user.clinicId },
    include: {
      locations: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!clinic) {
    return null;
  }

  const [providerCount, staffCount] = await Promise.all([
    prisma.provider.count({
      where: { clinicId: clinic.id, isActive: true },
    }),
    prisma.user.count({
      where: {
        clinicId: clinic.id,
        isActive: true,
        role: { in: ['SUPER_ADMIN', 'FRONT_DESK'] },
      },
    }),
  ]);

  return {
    ...clinic,
    launchLocation: clinic.locations[0] ?? null,
    stats: {
      providerCount,
      staffCount,
      locationCount: clinic.locations.length,
    },
  };
};

export const setupClinicForSuperAdmin = async (
  userId: string,
  data: CreateClinicData & { location: UpsertLaunchLocationData }
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, clinicId: true, role: true },
  });

  if (!user || user.role !== 'SUPER_ADMIN') {
    const err = new Error('Only super admins can set up a clinic') as ApiError;
    err.statusCode = 403;
    throw err;
  }

  if (user.clinicId) {
    const err = new Error('Clinic setup has already been completed') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const clinic = await prisma.$transaction(async (tx) => {
    const createdClinic = await tx.clinic.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        subscriptionPlan: data.subscriptionPlan || 'free',
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { clinicId: createdClinic.id },
    });

    await tx.location.create({
      data: {
        clinicId: createdClinic.id,
        name: data.location.name.trim(),
        address: data.location.address?.trim() || null,
        timezone: data.location.timezone,
      },
    });

    return createdClinic;
  });

  await auditService.logAudit({
    clinicId: clinic.id,
    entityType: 'Clinic',
    entityId: clinic.id,
    action: 'CREATE',
    newValue: {
      name: clinic.name,
      email: clinic.email,
    },
    performedById: userId,
  });

  return getClinicForUser(userId);
};

export const updateClinic = async (
  clinicId: string,
  data: UpdateClinicData,
  performedById: string
) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
  });

  if (!clinic) {
    const err = new Error('Clinic not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  const updated = await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.email !== undefined && { email: data.email.trim().toLowerCase() }),
      ...(data.subscriptionPlan !== undefined && {
        subscriptionPlan: data.subscriptionPlan,
      }),
    },
  });

  const auditFields: Array<keyof UpdateClinicData> = ['name', 'email', 'subscriptionPlan'];
  for (const field of auditFields) {
    if (data[field] !== undefined && clinic[field] !== updated[field]) {
      await auditService.logAudit({
        clinicId,
        entityType: 'Clinic',
        entityId: clinicId,
        action: 'UPDATE',
        fieldChanged: field,
        oldValue: clinic[field] as string | null,
        newValue: updated[field] as string | null,
        performedById,
      });
    }
  }

  return updated;
};

export const upsertLaunchLocation = async (
  clinicId: string,
  data: UpsertLaunchLocationData,
  performedById: string
) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      locations: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!clinic) {
    const err = new Error('Clinic not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  const existingLocation =
    (data.id
      ? clinic.locations.find((location) => location.id === data.id)
      : clinic.locations[0]) ?? null;

  if (!existingLocation) {
    const created = await prisma.location.create({
      data: {
        clinicId,
        name: data.name.trim(),
        address: data.address?.trim() || null,
        timezone: data.timezone,
      },
    });

    await auditService.logAudit({
      clinicId,
      entityType: 'Location',
      entityId: created.id,
      action: 'CREATE',
      newValue: {
        name: created.name,
        timezone: created.timezone,
      },
      performedById,
    });

    return created;
  }

  const updated = await prisma.location.update({
    where: { id: existingLocation.id },
    data: {
      name: data.name.trim(),
      address: data.address?.trim() || null,
      timezone: data.timezone,
    },
  });

  const auditFields: Array<keyof UpsertLaunchLocationData> = ['name', 'address', 'timezone'];
  for (const field of auditFields) {
    if (data[field] !== undefined && existingLocation[field] !== updated[field]) {
      await auditService.logAudit({
        clinicId,
        entityType: 'Location',
        entityId: updated.id,
        action: 'UPDATE',
        fieldChanged: field,
        oldValue: (existingLocation as Record<string, unknown>)[field] as string | null,
        newValue: (updated as Record<string, unknown>)[field] as string | null,
        performedById,
      });
    }
  }

  return updated;
};
