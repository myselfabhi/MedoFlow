import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import path from 'path';
import fs from 'fs';
import { logAudit } from './auditService';
import { ApiError } from '../types/errors';
import { UPLOAD_BASE } from '../config/multer';

export const uploadFile = async (params: {
  clinicId: string;
  patientId: string;
  visitRecordId?: string | null;
  uploadedById: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  tags?: unknown;
}): Promise<{ id: string }> => {
  const appointment = await prisma.appointment.findFirst({
    where: { clinicId: params.clinicId, patientId: params.patientId },
  });
  if (!appointment) {
    const err = new Error('Patient does not belong to clinic') as ApiError;
    err.statusCode = 403;
    throw err;
  }

  if (params.visitRecordId) {
    const visit = await prisma.visitRecord.findFirst({
      where: {
        id: params.visitRecordId,
        clinicId: params.clinicId,
        patientId: params.patientId,
      },
    });
    if (!visit) {
      const err = new Error('Visit record not found or does not belong to patient') as ApiError;
      err.statusCode = 404;
      throw err;
    }
  }

  const file = await prisma.patientFile.create({
    data: {
      clinicId: params.clinicId,
      patientId: params.patientId,
      visitRecordId: params.visitRecordId ?? null,
      uploadedById: params.uploadedById,
      originalName: params.originalName,
      storagePath: params.storagePath,
      mimeType: params.mimeType,
      size: params.size,
      tags: params.tags != null ? (params.tags as Prisma.InputJsonValue) : undefined,
    },
  });

  await logAudit({
    clinicId: params.clinicId,
    entityType: 'PatientFile',
    entityId: file.id,
    action: 'FILE_UPLOADED',
    newValue: { originalName: params.originalName, storagePath: params.storagePath },
    performedById: params.uploadedById,
  });

  return { id: file.id };
};

export const getFilesByPatient = async (
  clinicId: string,
  patientId: string
) => {
  return prisma.patientFile.findMany({
    where: {
      clinicId,
      patientId,
      isDeleted: false,
    },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      visitRecord: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const softDeleteFile = async (
  fileId: string,
  clinicId: string,
  performedById: string
): Promise<void> => {
  const file = await prisma.patientFile.findFirst({
    where: { id: fileId, clinicId },
  });
  if (!file) {
    const err = new Error('File not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  if (file.isDeleted) {
    const err = new Error('File already deleted') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  await prisma.patientFile.update({
    where: { id: fileId },
    data: { isDeleted: true },
  });

  await logAudit({
    clinicId,
    entityType: 'PatientFile',
    entityId: fileId,
    action: 'FILE_DELETED',
    oldValue: { originalName: file.originalName, storagePath: file.storagePath },
    performedById,
  });
};

export const getFileForDownload = async (
  fileId: string,
  clinicId: string
): Promise<{ filePath: string; originalName: string; mimeType: string } | null> => {
  const file = await prisma.patientFile.findFirst({
    where: { id: fileId, clinicId, isDeleted: false },
  });
  if (!file) return null;
  const safePath = path.join(UPLOAD_BASE, file.storagePath);
  const resolved = path.resolve(safePath);
  if (!resolved.startsWith(path.resolve(UPLOAD_BASE))) {
    return null;
  }
  if (!fs.existsSync(resolved)) return null;
  return {
    filePath: resolved,
    originalName: file.originalName,
    mimeType: file.mimeType,
  };
};

export const validatePatientBelongsToClinic = async (
  patientId: string,
  clinicId: string
): Promise<boolean> => {
  const apt = await prisma.appointment.findFirst({
    where: { patientId, clinicId },
  });
  return !!apt;
};

export const getFileById = async (
  fileId: string,
  clinicId: string
) => {
  return prisma.patientFile.findFirst({
    where: { id: fileId, clinicId, isDeleted: false },
    include: {
      uploadedBy: { select: { id: true, name: true } },
    },
  });
};
