import { Request, Response, NextFunction } from 'express';
import * as disciplineService from '../services/disciplineService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getClinicWhere } from '../middleware/clinicScope';
import { ApiError } from '../types/errors';

export const create = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.bypassClinicScope
      ? (req.body.clinicId as string)
      : req.clinicId;
    if (!clinicId) {
      const err = new Error('Clinic ID is required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const discipline = await disciplineService.createDiscipline(
      req.body,
      clinicId
    );
    successResponse(res, 201, 'Discipline created', { discipline });
  }
);

export const list = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const where = getClinicWhere(req);
    if (Object.keys(where).length === 0) {
      const err = new Error('Clinic scope required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const disciplines = await disciplineService.getDisciplines(where);
    successResponse(res, 200, 'Disciplines retrieved', { disciplines });
  }
);

export const update = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const id = req.params.id as string;
    const where = getClinicWhere(req);
    if (Object.keys(where).length === 0) {
      const err = new Error('Clinic scope required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const existing = await disciplineService.getDisciplineById(id, where);
    if (!existing) {
      const err = new Error('Discipline not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    const discipline = await disciplineService.updateDiscipline(
      id,
      req.body,
      where
    );
    successResponse(res, 200, 'Discipline updated', { discipline });
  }
);

export const remove = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const id = req.params.id as string;
    const where = getClinicWhere(req);
    if (Object.keys(where).length === 0) {
      const err = new Error('Clinic scope required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const existing = await disciplineService.getDisciplineById(id, where);
    if (!existing) {
      const err = new Error('Discipline not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    await disciplineService.deleteDiscipline(id, where, req.user!.id);
    successResponse(res, 200, 'Discipline deleted');
  }
);
