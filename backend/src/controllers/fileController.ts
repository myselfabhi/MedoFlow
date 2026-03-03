import { Request, Response, NextFunction } from 'express';
import * as fileService from '../services/fileService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { assertClinicAccess } from '../middleware/clinicScope';
import { generateStoragePath } from '../config/multer';
import { ApiError } from '../types/errors';
import fs from 'fs';

const parseTags = (val: unknown): unknown => {
  if (val === undefined || val === '') return undefined;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as unknown;
    } catch {
      return undefined;
    }
  }
  return val;
};

export const upload = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.bypassClinicScope
      ? (req.body.clinicId as string)
      : req.clinicId;
    const patientId = req.body.patientId as string;
    const visitRecordId = (req.body.visitRecordId as string) || undefined;

    if (!clinicId || !patientId) {
      const err = new Error('clinicId and patientId are required') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    assertClinicAccess(req, clinicId);

    const file = req.file;
    if (!file || !file.buffer) {
      const err = new Error('No file uploaded') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    const { dir, filename, relativePath } = generateStoragePath(
      clinicId,
      patientId,
      file.originalname
    );
    const destPath = `${dir}/${filename}`;
    fs.writeFileSync(destPath, file.buffer);

    const result = await fileService.uploadFile({
      clinicId,
      patientId,
      visitRecordId,
      uploadedById: req.user!.id,
      originalName: file.originalname,
      storagePath: relativePath.replace(/\\/g, '/'),
      mimeType: file.mimetype,
      size: file.size,
      tags: parseTags(req.body.tags),
    });

    successResponse(res, 201, 'File uploaded', { id: result.id });
  }
);

export const listByPatient = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const patientId = req.params.patientId as string;
    const clinicId = req.bypassClinicScope
      ? (req.query.clinicId as string)
      : req.clinicId;

    if (!clinicId) {
      const err = new Error('Clinic scope required') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    const files = await fileService.getFilesByPatient(clinicId, patientId);
    successResponse(res, 200, 'Files retrieved', { files });
  }
);

export const remove = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const fileId = req.params.id as string;
    const clinicId = req.bypassClinicScope
      ? (req.query.clinicId as string)
      : req.clinicId;

    if (!clinicId) {
      const err = new Error('Clinic scope required') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    await fileService.softDeleteFile(fileId, clinicId, req.user!.id);
    successResponse(res, 200, 'File deleted');
  }
);
