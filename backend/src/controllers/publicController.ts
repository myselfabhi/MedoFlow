import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../types/errors';
import * as slotHoldService from '../services/slotHoldService';
import * as availabilityService from '../services/availabilityService';

export const listClinics = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinics = await prisma.clinic.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
      },
      orderBy: { name: 'asc' },
    });
    successResponse(res, 200, 'Clinics retrieved', { clinics });
  }
);

export const getClinic = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const id = req.params.id as string;
    const clinic = await prisma.clinic.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
      },
    });
    if (!clinic) {
      const err = new Error('Clinic not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    successResponse(res, 200, 'Clinic retrieved', { clinic });
  }
);

export const getClinicServices = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const id = req.params.id as string;
    const services = await prisma.service.findMany({
      where: {
        clinicId: id,
        isActive: true,
        isArchived: false,
        discipline: { isArchived: false },
      },
      orderBy: { name: 'asc' },
      include: {
        discipline: { select: { id: true, name: true } },
      },
    });
    successResponse(res, 200, 'Services retrieved', { services });
  }
);

export const getClinicProviders = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = (req.params.id as string) || (req.query.clinicId as string);
    const providers = await prisma.provider.findMany({
      where: { clinicId, isActive: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        disciplines: { include: { discipline: { select: { id: true, name: true } } } },
        locationAssignments: {
          where: { location: { isActive: true } },
          include: {
            location: { select: { id: true, name: true, timezone: true } },
          },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        providerServices: {
          select: { serviceId: true },
        },
      },
    });
    successResponse(res, 200, 'Providers retrieved', { providers });
  }
);

export const getClinicLocations = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const id = req.params.id as string;
    const locations = await prisma.location.findMany({
      where: { clinicId: id, isActive: true },
      select: { id: true, name: true, address: true, timezone: true },
    });
    successResponse(res, 200, 'Locations retrieved', { locations });
  }
);

export const checkPatientExists = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      const err = new Error('Email is required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const user = await prisma.user.findUnique({
      where: { email, role: 'PATIENT' },
      select: { id: true },
    });
    successResponse(res, 200, 'Check complete', { exists: !!user });
  }
);

export const getAvailability = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const {
      clinicId,
      serviceId,
      providerId,
      locationId,
      date,
    } = req.query as {
      clinicId?: string;
      serviceId?: string;
      providerId?: string;
      locationId?: string;
      date?: string;
    };

    if (!clinicId || !serviceId || !date) {
      const err = new Error(
        'clinicId, serviceId, and date are required'
      ) as ApiError;
      err.statusCode = 400;
      err.code = 'validation_error';
      throw err;
    }

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        clinicId,
        isActive: true,
        isArchived: false,
        discipline: { isArchived: false },
      },
    });
    if (!service) {
      const err = new Error('Service not found') as ApiError;
      err.statusCode = 404;
      err.code = 'validation_error';
      throw err;
    }

    const resolvedLocation =
      (locationId
        ? await prisma.location.findFirst({
            where: { id: locationId, clinicId, isActive: true },
            select: { id: true, timezone: true },
          })
        : await prisma.location.findFirst({
            where: { clinicId, isActive: true },
            orderBy: { createdAt: 'asc' },
            select: { id: true, timezone: true },
          })) ?? null;

    if (!resolvedLocation) {
      const err = new Error('Location not found') as ApiError;
      err.statusCode = 404;
      err.code = 'validation_error';
      throw err;
    }

    let providerIds: string[] = [];
    if (providerId) {
      const p = await prisma.provider.findFirst({
        where: {
          id: providerId,
          clinicId,
          isActive: true,
          providerServices: { some: { serviceId } },
          locationAssignments: { some: { locationId: resolvedLocation.id } },
        },
      });
      if (p) providerIds = [p.id];
    } else {
      const providers = await prisma.provider.findMany({
        where: {
          clinicId,
          isActive: true,
          providerServices: { some: { serviceId } },
          locationAssignments: { some: { locationId: resolvedLocation.id } },
        },
        select: { id: true },
      });
      providerIds = providers.map((p) => p.id);
    }

    const slots: Awaited<ReturnType<typeof availabilityService.getAvailableSlots>> = [];
    for (const pid of providerIds) {
      const providerSlots = await availabilityService.getAvailableSlots({
        providerId: pid,
        serviceId,
        locationId: resolvedLocation.id,
        serviceDurationMinutes: service.duration,
        date,
        clinicId,
      });
      slots.push(...providerSlots);
    }

    slots.sort((left, right) => left.start.localeCompare(right.start));

    successResponse(res, 200, 'Availability retrieved', { slots });
  }
);

export const createSlotHold = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const {
      clinicId,
      providerId,
      serviceId,
      locationId,
      timezone,
      startTime,
      endTime,
      patientId,
    } = req.body as {
      clinicId: string;
      providerId: string;
      serviceId: string;
      locationId?: string | null;
      timezone: string;
      startTime: string;
      endTime: string;
      patientId?: string;
    };
    if (!clinicId || !providerId || !serviceId || !startTime || !endTime || !timezone) {
      const err = new Error(
        'clinicId, providerId, serviceId, timezone, startTime, and endTime are required'
      ) as ApiError;
      err.statusCode = 400;
      err.code = 'validation_error';
      throw err;
    }
    const hold = await slotHoldService.createSlotHold({
      clinicId,
      providerId,
      serviceId,
      locationId: locationId ?? null,
      timezone,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      patientId,
      performedById: patientId,
    });
    successResponse(res, 201, 'Slot hold created', { hold });
  }
);

export const releaseSlotHold = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const holdId = req.params.holdId as string;
    const clinicId = (req.query.clinicId as string) || (req.body?.clinicId as string);
    if (!clinicId) {
      const err = new Error('clinicId is required') as ApiError;
      err.statusCode = 400;
      err.code = 'validation_error';
      throw err;
    }
    const released = await slotHoldService.releaseSlotHold(holdId, clinicId);
    successResponse(res, 200, released ? 'Slot hold released' : 'Slot hold not found', {
      released,
    });
  }
);
