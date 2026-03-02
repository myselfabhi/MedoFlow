import prisma from '../config/prisma';
import { Request } from 'express';
import { ApiError } from '../types/errors';
import { AppointmentStatus } from '@prisma/client';
import * as auditService from './auditService';

const CANCELLED_STATUS = 'CANCELLED';

export interface CreateAppointmentData {
  locationId: string;
  providerId: string;
  serviceId: string;
  patientId: string;
  startTime: string | Date;
  endTime: string | Date;
}

const validateServiceBelongsToClinic = async (
  serviceId: string,
  clinicId: string
) => {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, clinicId, isActive: true },
  });
  if (!service) {
    const err = new Error(
      'Service not found or does not belong to this clinic'
    ) as ApiError;
    err.statusCode = 404;
    throw err;
  }
  return service;
};

const validateProviderOffersService = async (
  providerId: string,
  serviceId: string,
  clinicId: string
) => {
  const provider = await prisma.provider.findFirst({
    where: { id: providerId, clinicId, isActive: true },
    include: {
      providerServices: {
        where: { serviceId },
        include: { service: true },
      },
    },
  });
  if (!provider) {
    const err = new Error(
      'Provider not found or does not belong to this clinic'
    ) as ApiError;
    err.statusCode = 404;
    throw err;
  }
  const assignment = provider.providerServices[0];
  if (!assignment) {
    const err = new Error('Provider does not offer this service') as ApiError;
    err.statusCode = 400;
    throw err;
  }
  return assignment;
};

const validateLocationBelongsToClinic = async (
  locationId: string,
  clinicId: string
) => {
  const location = await prisma.location.findFirst({
    where: { id: locationId, clinicId, isActive: true },
  });
  if (!location) {
    const err = new Error(
      'Location not found or does not belong to this clinic'
    ) as ApiError;
    err.statusCode = 404;
    throw err;
  }
  return location;
};

const validatePatient = async (patientId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: patientId },
  });
  if (!user) {
    const err = new Error('Patient not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  if (user.role !== 'PATIENT') {
    const err = new Error('User is not a patient') as ApiError;
    err.statusCode = 400;
    throw err;
  }
  return user;
};

const checkDoubleBooking = async (
  providerId: string,
  startTime: Date,
  endTime: Date,
  excludeId: string | null = null
): Promise<void> => {
  const conflicting = await prisma.appointment.findFirst({
    where: {
      providerId,
      status: { not: CANCELLED_STATUS },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (conflicting) {
    const err = new Error(
      'Provider has a conflicting appointment in this time slot'
    ) as ApiError;
    err.statusCode = 409;
    throw err;
  }
};

export const createAppointment = async (
  data: CreateAppointmentData,
  clinicId: string
) => {
  const {
    locationId,
    providerId,
    serviceId,
    patientId,
    startTime,
    endTime,
  } = data;

  await validateServiceBelongsToClinic(serviceId, clinicId);
  const assignment = await validateProviderOffersService(
    providerId,
    serviceId,
    clinicId
  );
  await validateLocationBelongsToClinic(locationId, clinicId);
  await validatePatient(patientId);
  await checkDoubleBooking(
    providerId,
    new Date(startTime),
    new Date(endTime)
  );

  const priceAtBooking =
    assignment.priceOverride ?? assignment.service.defaultPrice;

  return prisma.appointment.create({
    data: {
      clinicId,
      locationId,
      providerId,
      serviceId,
      patientId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: 'CONFIRMED',
      priceAtBooking,
    },
    include: {
      clinic: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
      provider: {
        include: {
          discipline: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      },
      service: { select: { id: true, name: true, duration: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

export const getAppointmentsByPatient = async (
  patientId: string,
  clinicId?: string | null
) => {
  const where: { patientId: string; clinicId?: string } = { patientId };
  if (clinicId) where.clinicId = clinicId;
  return prisma.appointment.findMany({
    where,
    orderBy: { startTime: 'desc' },
    include: {
      location: { select: { id: true, name: true } },
      provider: {
        include: {
          discipline: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      },
      service: { select: { id: true, name: true } },
    },
  });
};

export const getAppointmentsByProvider = async (
  providerId: string,
  clinicId?: string | null
) => {
  const where: { providerId: string; clinicId?: string } = { providerId };
  if (clinicId) where.clinicId = clinicId;
  return prisma.appointment.findMany({
    where,
    orderBy: { startTime: 'desc' },
    include: {
      location: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

export const getAppointmentsByClinic = async (clinicId: string) => {
  return prisma.appointment.findMany({
    where: { clinicId },
    orderBy: { startTime: 'desc' },
    include: {
      location: { select: { id: true, name: true } },
      provider: {
        include: {
          discipline: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      },
      service: { select: { id: true, name: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

export const getAppointmentById = async (
  id: string,
  where: { clinicId?: string; patientId?: string } = {}
) => {
  return prisma.appointment.findFirst({
    where: { id, ...where } as { id: string; clinicId?: string; patientId?: string },
    include: {
      clinic: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
      provider: {
        include: {
          discipline: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      },
      service: { select: { id: true, name: true, duration: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

export const getProviderByUserId = async (userId: string) => {
  return prisma.provider.findFirst({
    where: { userId },
  });
};

export const updateAppointmentStatus = async (
  id: string,
  status: AppointmentStatus,
  req: Request
) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) {
    const err = new Error('Appointment not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  if (req.user?.role === 'PROVIDER') {
    const provider = await getProviderByUserId(req.user.id);
    if (!provider || provider.id !== appointment.providerId) {
      const err = new Error('Access denied') as ApiError;
      err.statusCode = 403;
      throw err;
    }
    const allowedStatuses = ['COMPLETED', 'NO_SHOW', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      const err = new Error(
        'Provider can only update status to COMPLETED, NO_SHOW, or CANCELLED'
      ) as ApiError;
      err.statusCode = 403;
      throw err;
    }
  }

  if (req.user?.role === 'PATIENT') {
    if (appointment.patientId !== req.user.id) {
      const err = new Error('Access denied') as ApiError;
      err.statusCode = 403;
      throw err;
    }
    const allowedStatuses = ['CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      const err = new Error('Patient can only cancel appointments') as ApiError;
      err.statusCode = 403;
      throw err;
    }
  }

  if (
    req.user?.role === 'CLINIC_ADMIN' &&
    req.clinicId !== appointment.clinicId
  ) {
    const err = new Error('Access denied') as ApiError;
    err.statusCode = 403;
    throw err;
  }

  const performedById = req.user?.id;
  if (performedById && appointment.status !== status) {
    await auditService.logAudit({
      clinicId: appointment.clinicId,
      entityType: 'Appointment',
      entityId: id,
      action: 'UPDATE',
      fieldChanged: 'status',
      oldValue: appointment.status,
      newValue: status,
      performedById,
    });
  }

  return prisma.appointment.update({
    where: { id },
    data: { status },
    include: {
      location: { select: { id: true, name: true } },
      provider: {
        include: {
          discipline: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      },
      service: { select: { id: true, name: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};
