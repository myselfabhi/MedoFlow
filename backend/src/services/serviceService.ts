import prisma from '../config/prisma';
import { ApiError } from '../types/errors';

export interface CreateServiceData {
  disciplineId: string;
  name: string;
  duration: number;
  defaultPrice: number | string;
  taxApplicable?: boolean;
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

export const createService = async (
  data: CreateServiceData,
  clinicId: string
) => {
  await validateDisciplineBelongsToClinic(data.disciplineId, clinicId);

  const existing = await prisma.service.findFirst({
    where: { clinicId, name: data.name },
  });
  if (existing) {
    const err = new Error(
      'Service with this name already exists in this clinic'
    ) as ApiError;
    err.statusCode = 409;
    throw err;
  }

  return prisma.service.create({
    data: {
      clinicId,
      disciplineId: data.disciplineId,
      name: data.name,
      duration: data.duration,
      defaultPrice: data.defaultPrice,
      taxApplicable: data.taxApplicable ?? false,
    },
    include: {
      discipline: { select: { id: true, name: true } },
    },
  });
};

export const getServices = async (where: ClinicWhere) => {
  const whereClause = Object.keys(where).length === 0 ? { isActive: true } : { ...where, isActive: true };
  return prisma.service.findMany({
    where: whereClause as { isActive: boolean; clinicId?: string },
    orderBy: { name: 'asc' },
    include: {
      discipline: { select: { id: true, name: true } },
      _count: { select: { providerServices: true } },
    },
  });
};

export const getServiceById = async (id: string, where: ClinicWhere = {}) => {
  const whereClause = Object.keys(where).length === 0 ? { id } : { id, ...where };
  return prisma.service.findFirst({
    where: whereClause as { id: string; clinicId?: string },
    include: {
      discipline: { select: { id: true, name: true } },
    },
  });
};

export const updateService = async (
  id: string,
  data: Partial<CreateServiceData & { isActive?: boolean; disciplineId?: string }>,
  where: ClinicWhere
) => {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    const err = new Error('Service not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  const clinicId = 'clinicId' in where ? where.clinicId : service.clinicId;

  if (data.name) {
    const existing = await prisma.service.findFirst({
      where: {
        clinicId: clinicId || undefined,
        name: data.name,
        NOT: { id },
      },
    });
    if (existing) {
      const err = new Error(
        'Service with this name already exists in this clinic'
      ) as ApiError;
      err.statusCode = 409;
      throw err;
    }
  }

  if (data.disciplineId) {
    await validateDisciplineBelongsToClinic(data.disciplineId, clinicId || service.clinicId);
  }

  return prisma.service.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.defaultPrice !== undefined && { defaultPrice: data.defaultPrice }),
      ...(data.taxApplicable !== undefined && { taxApplicable: data.taxApplicable }),
      ...(data.disciplineId && { disciplineId: data.disciplineId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      discipline: { select: { id: true, name: true } },
    },
  });
};

export const archiveService = async (id: string, where: ClinicWhere) => {
  const service = await getServiceById(id, where);
  if (!service) {
    const err = new Error('Service not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  return prisma.service.update({
    where: { id },
    data: { isActive: false },
    include: {
      discipline: { select: { id: true, name: true } },
    },
  });
};
