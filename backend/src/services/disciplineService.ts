import prisma from '../config/prisma';
import { ApiError } from '../types/errors';
import * as auditService from './auditService';

export interface CreateDisciplineData {
  name: string;
  description?: string;
}

type ClinicWhere = { clinicId?: string } | Record<string, never>;

export const createDiscipline = async (
  data: CreateDisciplineData,
  clinicId: string
) => {
  const existing = await prisma.discipline.findFirst({
    where: { clinicId, name: data.name },
  });
  if (existing) {
    const err = new Error(
      'Discipline with this name already exists in this clinic'
    ) as ApiError;
    err.statusCode = 409;
    throw err;
  }
  return prisma.discipline.create({
    data: {
      clinicId,
      name: data.name,
      description: data.description,
    },
  });
};

export const getDisciplines = async (where: ClinicWhere) => {
  const whereClause = Object.keys(where).length === 0 ? { isActive: true } : { ...where, isActive: true };
  return prisma.discipline.findMany({
    where: whereClause as { isActive: boolean; clinicId?: string },
    orderBy: { name: 'asc' },
    include: { _count: { select: { providers: true } } },
  });
};

export const getDisciplineById = async (
  id: string,
  where: ClinicWhere = {}
) => {
  const whereClause = Object.keys(where).length === 0 ? { id } : { id, ...where };
  return prisma.discipline.findFirst({
    where: whereClause as { id: string; clinicId?: string },
  });
};

export const updateDiscipline = async (
  id: string,
  data: Partial<CreateDisciplineData>,
  where: ClinicWhere
) => {
  const discipline = await prisma.discipline.findUnique({ where: { id } });
  if (!discipline) {
    const err = new Error('Discipline not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  const clinicId = 'clinicId' in where ? where.clinicId : discipline.clinicId;
  if (data.name) {
    const existing = await prisma.discipline.findFirst({
      where: {
        clinicId: clinicId || undefined,
        name: data.name,
        NOT: { id },
      },
    });
    if (existing) {
      const err = new Error(
        'Discipline with this name already exists in this clinic'
      ) as ApiError;
      err.statusCode = 409;
      throw err;
    }
  }
  return prisma.discipline.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });
};

export const deleteDiscipline = async (
  id: string,
  where: ClinicWhere,
  performedById: string
) => {
  const findWhere = Object.keys(where).length === 0 ? { id } : { id, ...where };
  const discipline = await prisma.discipline.findFirst({
    where: findWhere as { id: string; clinicId?: string },
    include: { _count: { select: { services: true } } },
  });
  if (!discipline) {
    const err = new Error('Discipline not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  const activeServicesCount = await prisma.service.count({
    where: { disciplineId: id, isActive: true },
  });
  if (activeServicesCount > 0) {
    const err = new Error(
      'Cannot delete discipline with active services. Archive instead.'
    ) as ApiError;
    err.statusCode = 400;
    throw err;
  }
  const updateWhere = Object.keys(where).length === 0 ? { id } : { id, ...where };
  const updated = await prisma.discipline.update({
    where: updateWhere as { id: string; clinicId?: string },
    data: { isActive: false },
  });
  if (discipline.isActive) {
    await auditService.logAudit({
      clinicId: discipline.clinicId,
      entityType: 'Discipline',
      entityId: id,
      action: 'ARCHIVE',
      fieldChanged: 'isActive',
      oldValue: true,
      newValue: false,
      performedById,
    });
  }
  return updated;
};
