import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analyticsService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../types/errors';

export const getOverview = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId!;
    const overview = await analyticsService.getOverview(clinicId);
    successResponse(res, 200, 'Analytics overview', overview);
  }
);

export const getRevenueByService = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId!;
    const data = await analyticsService.getRevenueByService(clinicId);
    successResponse(res, 200, 'Revenue by service', { data });
  }
);

export const getRevenueByProvider = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId!;
    const data = await analyticsService.getRevenueByProvider(clinicId);
    successResponse(res, 200, 'Revenue by provider', { data });
  }
);

export const getAppointmentsByDiscipline = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId!;
    const data = await analyticsService.getAppointmentsByDiscipline(clinicId);
    successResponse(res, 200, 'Appointments by discipline', { data });
  }
);
