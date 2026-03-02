import { Request, Response, NextFunction } from 'express';
import * as serviceService from '../services/serviceService';
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
    const service = await serviceService.createService(req.body, clinicId);
    successResponse(res, 201, 'Service created', { service });
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
    const services = await serviceService.getServices(where);
    successResponse(res, 200, 'Services retrieved', { services });
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
    const existing = await serviceService.getServiceById(id, where);
    if (!existing) {
      const err = new Error('Service not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    const service = await serviceService.updateService(id, req.body, where);
    successResponse(res, 200, 'Service updated', { service });
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
    const existing = await serviceService.getServiceById(id, where);
    if (!existing) {
      const err = new Error('Service not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    const service = await serviceService.archiveService(id, where);
    successResponse(res, 200, 'Service archived', { service });
  }
);
