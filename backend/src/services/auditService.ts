import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';

export interface LogAuditParams {
  clinicId: string;
  entityType: string;
  entityId: string;
  action: string;
  fieldChanged?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  performedById: string;
}

export const logAudit = async (params: LogAuditParams): Promise<void> => {
  const {
    clinicId,
    entityType,
    entityId,
    action,
    fieldChanged,
    oldValue,
    newValue,
    performedById,
  } = params;

  await prisma.auditLog.create({
    data: {
      clinicId,
      entityType,
      entityId,
      action,
      fieldChanged: fieldChanged ?? null,
      oldValue:
        oldValue != null ? (oldValue as Prisma.InputJsonValue) : Prisma.JsonNull,
      newValue:
        newValue != null ? (newValue as Prisma.InputJsonValue) : Prisma.JsonNull,
      performedById,
    },
  });
};
