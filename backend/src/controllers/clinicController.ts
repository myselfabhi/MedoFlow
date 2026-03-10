import { Request, Response, NextFunction } from 'express';
import * as clinicService from '../services/clinicService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../types/errors';

export const getCurrent = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinic = await clinicService.getClinicForUser(req.user!.id);
    successResponse(res, 200, 'Clinic retrieved', { clinic });
  }
);

export const setup = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinic = await clinicService.setupClinicForSuperAdmin(req.user!.id, req.body);
    successResponse(res, 201, 'Clinic setup completed', { clinic });
  }
);

export const update = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId;
    if (!clinicId) {
      const err = new Error('Clinic scope required') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    const clinic = await clinicService.updateClinic(clinicId, req.body, req.user!.id);
    successResponse(res, 200, 'Clinic updated', { clinic });
  }
);

export const upsertLaunchLocation = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId;
    if (!clinicId) {
      const err = new Error('Clinic scope required') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    const location = await clinicService.upsertLaunchLocation(
      clinicId,
      req.body,
      req.user!.id
    );
    successResponse(res, 200, 'Launch location saved', { location });
  }
);
