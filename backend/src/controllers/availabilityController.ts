import { Request, Response, NextFunction } from 'express';
import * as availabilityService from '../services/availabilityService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../types/errors';
import prisma from '../config/prisma';

export const getProviderAvailability = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const providerId = req.params.id as string;
    const date = req.query.date as string;
    const serviceDuration = req.query.serviceDuration as string;

    if (!date || !serviceDuration) {
      const err = new Error('date and serviceDuration are required') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    const serviceDurationMinutes = parseInt(serviceDuration, 10);
    if (isNaN(serviceDurationMinutes) || serviceDurationMinutes <= 0) {
      const err = new Error('serviceDuration must be a positive number') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    const provider = await prisma.provider.findFirst({
      where: { id: providerId, isActive: true },
      select: { clinicId: true },
    });
    if (!provider) {
      const err = new Error('Provider not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }

    const clinicId = req.clinicId ?? provider.clinicId;

    const slots = await availabilityService.getAvailableSlots({
      providerId,
      serviceDurationMinutes,
      date,
      clinicId: clinicId ?? undefined,
    });

    successResponse(res, 200, 'Availability retrieved', { slots });
  }
);

export const createAvailability = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const providerId = req.params.id as string;
    const clinicId = req.bypassClinicScope
      ? (req.body.clinicId as string)
      : req.clinicId;
    if (!clinicId) {
      const err = new Error('Clinic ID is required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const availability = await availabilityService.createAvailability(
      { ...req.body, providerId },
      clinicId,
      req.user!.id
    );
    successResponse(res, 201, 'Availability created', { availability });
  }
);

export const updateAvailability = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const id = req.params.availabilityId as string;
    const clinicId = req.bypassClinicScope
      ? (req.body.clinicId as string)
      : req.clinicId;
    if (!clinicId) {
      const err = new Error('Clinic ID is required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const availability = await availabilityService.updateAvailability(
      id,
      req.body,
      clinicId,
      req.user!.id
    );
    successResponse(res, 200, 'Availability updated', { availability });
  }
);

export const createUnavailability = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const providerId = req.params.id as string;
    const clinicId = req.bypassClinicScope
      ? (req.body.clinicId as string)
      : req.clinicId;
    if (!clinicId) {
      const err = new Error('Clinic ID is required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const unavailability = await availabilityService.createUnavailability(
      { ...req.body, providerId },
      clinicId,
      req.user!.id
    );
    successResponse(res, 201, 'Unavailability created', { unavailability });
  }
);
