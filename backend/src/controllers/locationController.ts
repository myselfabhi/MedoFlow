import { Request, Response, NextFunction } from 'express';
import * as locationService from '../services/locationService';
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
    const location = await locationService.createLocation(req.body, clinicId);
    successResponse(res, 201, 'Location created', { location });
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
    const locations = await locationService.getLocations(where);
    successResponse(res, 200, 'Locations retrieved', { locations });
  }
);
