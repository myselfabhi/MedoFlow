import { Request, Response, NextFunction } from 'express';
import * as packageUsageService from '../services/packageUsageService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getMyPackages = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId!;
    const patientId = req.user!.id;
    const packages = await packageUsageService.getAvailablePatientPackages(clinicId, patientId);
    successResponse(res, 200, 'Patient packages retrieved', { packages });
  }
);
