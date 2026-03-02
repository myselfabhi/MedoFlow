import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../types/errors';

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
      where: { clinicId: id, isActive: true },
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
        disciplineId: true,
        discipline: { select: { id: true, name: true } },
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
      date,
    } = req.query as {
      clinicId?: string;
      serviceId?: string;
      providerId?: string;
      date?: string;
    };

    if (!clinicId || !serviceId || !date) {
      const err = new Error(
        'clinicId, serviceId, and date are required'
      ) as ApiError;
      err.statusCode = 400;
      throw err;
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, clinicId, isActive: true },
    });
    if (!service) {
      const err = new Error('Service not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }

    let providerIds: string[] = [];
    if (providerId) {
      const p = await prisma.provider.findFirst({
        where: { id: providerId, clinicId, isActive: true },
      });
      if (p) providerIds = [p.id];
    } else {
      const providers = await prisma.provider.findMany({
        where: {
          clinicId,
          isActive: true,
          providerServices: { some: { serviceId } },
        },
        select: { id: true },
      });
      providerIds = providers.map((p) => p.id);
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        providerId: { in: providerIds },
        status: { notIn: ['CANCELLED'] },
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
      },
      select: { providerId: true, startTime: true, endTime: true },
    });

    const slotDuration = service.duration;
    const slots: { start: string; end: string }[] = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const start = new Date(dayStart);
        start.setHours(hour, min, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + slotDuration);
        if (
          end.getHours() > 17 ||
          (end.getHours() === 17 && end.getMinutes() > 0)
        )
          continue;
        let available = false;
        for (const pid of providerIds) {
          const providerAppointments = appointments.filter(
            (a) => a.providerId === pid
          );
          const hasConflict = providerAppointments.some(
            (apt) => start < apt.endTime && end > apt.startTime
          );
          if (!hasConflict) {
            available = true;
            break;
          }
        }
        if (available) {
          slots.push({ start: start.toISOString(), end: end.toISOString() });
        }
      }
    }

    successResponse(res, 200, 'Availability retrieved', { slots });
  }
);
