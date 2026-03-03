import prisma from '../config/prisma';
import { Request } from 'express';
import { ApiError } from '../types/errors';
import { AppointmentStatus, Prisma } from '@prisma/client';
import * as auditService from './auditService';
import * as waitlistService from './waitlistService';

const CANCELLED_STATUS = 'CANCELLED';

export interface CreateAppointmentData {
  locationId: string;
  providerId: string;
  serviceId: string;
  patientId: string;
  startTime: string | Date;
  endTime: string | Date;
}

export interface CreateAppointmentContext {
  performedById?: string;
  excludeAppointmentId?: string;
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
      status: { notIn: [CANCELLED_STATUS, RESCHEDULED_STATUS] },
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

const RESCHEDULED_STATUS = 'RESCHEDULED';

const checkSamePatientOverlap = async (
  patientId: string,
  startTime: Date,
  endTime: Date,
  excludeId: string | null = null
): Promise<void> => {
  const conflicting = await prisma.appointment.findFirst({
    where: {
      patientId,
      status: { notIn: [CANCELLED_STATUS, RESCHEDULED_STATUS] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (conflicting) {
    const err = new Error(
      'You already have another appointment during this time.'
    ) as ApiError;
    err.statusCode = 409;
    throw err;
  }
};

const checkMinimumNotice = (
  startTime: Date,
  minimumNoticeMinutes: number,
  clinicId: string,
  serviceId: string,
  performedById: string | undefined
): void => {
  if (minimumNoticeMinutes <= 0) return;
  const now = new Date();
  const diffMinutes = (startTime.getTime() - now.getTime()) / (1000 * 60);
  if (diffMinutes < minimumNoticeMinutes) {
    const hours = Math.ceil(minimumNoticeMinutes / 60);
    const err = new Error(
      `This service requires at least ${hours} hour${hours !== 1 ? 's' : ''} notice.`
    ) as ApiError;
    err.statusCode = 400;
    throw err;
  }
};

const checkMaxFutureBooking = (
  startTime: Date,
  maxFutureBookingDays: number,
  clinicId: string,
  serviceId: string,
  performedById: string | undefined
): void => {
  const now = new Date();
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + maxFutureBookingDays);
  maxDate.setHours(23, 59, 59, 999);
  if (startTime > maxDate) {
    const err = new Error(
      `Appointments cannot be booked more than ${maxFutureBookingDays} days in advance.`
    ) as ApiError;
    err.statusCode = 400;
    throw err;
  }
};

const logBookingRejectedPolicy = async (
  clinicId: string,
  serviceId: string,
  reason: string,
  performedById: string
): Promise<void> => {
  await auditService.logAudit({
    clinicId,
    entityType: 'Booking',
    entityId: serviceId,
    action: 'BOOKING_REJECTED_POLICY',
    fieldChanged: 'reason',
    newValue: reason,
    performedById,
  });
};

export const createAppointment = async (
  data: CreateAppointmentData,
  clinicId: string,
  context?: CreateAppointmentContext
) => {
  const {
    locationId,
    providerId,
    serviceId,
    patientId,
    startTime,
    endTime,
  } = data;

  const performedById = context?.performedById;
  const excludeAppointmentId = context?.excludeAppointmentId ?? null;
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  return prisma.$transaction(async (tx) => {
    const service = await tx.service.findFirst({
      where: { id: serviceId, clinicId, isActive: true },
    });
    if (!service) {
      const err = new Error(
        'Service not found or does not belong to this clinic'
      ) as ApiError;
      err.statusCode = 404;
      throw err;
    }

    const provider = await tx.provider.findFirst({
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

    const location = await tx.location.findFirst({
      where: { id: locationId, clinicId, isActive: true },
    });
    if (!location) {
      const err = new Error(
        'Location not found or does not belong to this clinic'
      ) as ApiError;
      err.statusCode = 404;
      throw err;
    }

    const user = await tx.user.findUnique({
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

    const samePatientConflict = await tx.appointment.findFirst({
      where: {
        patientId,
        status: { notIn: [CANCELLED_STATUS, RESCHEDULED_STATUS] },
        startTime: { lt: endDate },
        endTime: { gt: startDate },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
    });
    if (samePatientConflict) {
      if (performedById) {
        await tx.auditLog.create({
          data: {
            clinicId,
            entityType: 'Booking',
            entityId: serviceId,
            action: 'BOOKING_REJECTED_POLICY',
            fieldChanged: 'reason',
            newValue: 'You already have another appointment during this time.' as Prisma.InputJsonValue,
            oldValue: Prisma.JsonNull,
            performedById,
          },
        });
      }
      const err = new Error(
        'You already have another appointment during this time.'
      ) as ApiError;
      err.statusCode = 409;
      throw err;
    }

    const minNotice = service.minimumNoticeMinutes ?? 0;
    const maxFuture = service.maxFutureBookingDays ?? 365;

    try {
      checkMinimumNotice(
        startDate,
        minNotice,
        clinicId,
        serviceId,
        performedById
      );
    } catch (err) {
      if (performedById) {
        await tx.auditLog.create({
          data: {
            clinicId,
            entityType: 'Booking',
            entityId: serviceId,
            action: 'BOOKING_REJECTED_POLICY',
            fieldChanged: 'reason',
            newValue: (err as Error).message as unknown as Prisma.InputJsonValue,
            oldValue: Prisma.JsonNull,
            performedById,
          },
        });
      }
      throw err;
    }

    try {
      checkMaxFutureBooking(
        startDate,
        maxFuture,
        clinicId,
        serviceId,
        performedById
      );
    } catch (err) {
      if (performedById) {
        await tx.auditLog.create({
          data: {
            clinicId,
            entityType: 'Booking',
            entityId: serviceId,
            action: 'BOOKING_REJECTED_POLICY',
            fieldChanged: 'reason',
            newValue: (err as Error).message as unknown as Prisma.InputJsonValue,
            oldValue: Prisma.JsonNull,
            performedById,
          },
        });
      }
      throw err;
    }

    const doubleBookConflict = await tx.appointment.findFirst({
      where: {
        providerId,
        status: { notIn: [CANCELLED_STATUS, RESCHEDULED_STATUS] },
        startTime: { lt: endDate },
        endTime: { gt: startDate },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
    });
    if (doubleBookConflict) {
      const err = new Error(
        'Provider has a conflicting appointment in this time slot'
      ) as ApiError;
      err.statusCode = 409;
      throw err;
    }

    const priceAtBooking =
      assignment.priceOverride ?? assignment.service.defaultPrice;
    const requirePrepayment = Boolean(service.requirePrepayment);
    const now = new Date();
    const slotHoldMinutes = 10;
    const slotHeldUntil = requirePrepayment
      ? new Date(now.getTime() + slotHoldMinutes * 60 * 1000)
      : null;

    const appointmentData = {
      clinicId,
      locationId,
      providerId,
      serviceId,
      patientId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: (requirePrepayment ? 'PENDING_PAYMENT' : 'CONFIRMED') as const,
      priceAtBooking,
      paymentStatus: (requirePrepayment ? 'PENDING' : 'NONE') as const,
      paymentDueAt: requirePrepayment ? slotHeldUntil! : null,
      slotHeldUntil,
    };

    const appointment = await tx.appointment.create({
      data: appointmentData,
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

    if (requirePrepayment && performedById) {
      await tx.auditLog.create({
        data: {
          clinicId,
          entityType: 'Appointment',
          entityId: appointment.id,
          action: 'PAYMENT_INITIATED',
          fieldChanged: null,
          oldValue: Prisma.JsonNull,
          newValue: {
            slotHeldUntil: slotHeldUntil?.toISOString(),
            amount: Number(priceAtBooking),
          } as Prisma.InputJsonValue,
          performedById,
        },
      });
    }

    return appointment;
  });
};

export interface CancelAppointmentResult {
  appointment: Awaited<ReturnType<typeof prisma.appointment.update>>;
  lateCancellation: boolean;
  cancellationFee?: { type: string; value: string; amount?: string };
}

export const cancelAppointment = async (
  appointmentId: string,
  reason: string,
  performedById: string,
  where: { clinicId?: string; patientId?: string; providerId?: string } = {}
): Promise<CancelAppointmentResult> => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, ...where },
    include: { service: true },
  });
  if (!appointment) {
    const err = new Error('Appointment not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  if (appointment.status === 'CANCELLED') {
    const err = new Error('Appointment is already cancelled') as ApiError;
    err.statusCode = 400;
    throw err;
  }
  const windowHours = appointment.service.cancellationWindowHours ?? 0;
  const now = new Date();
  const hoursBeforeStart =
    (appointment.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const withinWindow = hoursBeforeStart <= windowHours;
  let cancellationFee: CancelAppointmentResult['cancellationFee'] | undefined;
  const feeType = appointment.service.cancellationFeeType ?? 'NONE';
  if (withinWindow && feeType !== 'NONE' && appointment.service.cancellationFeeValue != null) {
    const val = Number(appointment.service.cancellationFeeValue);
    if (feeType === 'FIXED') {
      cancellationFee = { type: 'FIXED', value: val.toString(), amount: val.toString() };
    } else if (feeType === 'PERCENTAGE') {
      const amount = (Number(appointment.priceAtBooking) * val) / 100;
      cancellationFee = { type: 'PERCENTAGE', value: val.toString(), amount: amount.toFixed(2) };
    }
  }
  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'CANCELLED',
      cancelledAt: now,
      cancellationReason: reason,
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
  await auditService.logAudit({
    clinicId: appointment.clinicId,
    entityType: 'Appointment',
    entityId: appointmentId,
    action: 'APPOINTMENT_CANCELLED',
    fieldChanged: 'status',
    oldValue: { status: appointment.status },
    newValue: {
      status: 'CANCELLED',
      reason,
      withinCancellationWindow: withinWindow,
    },
    performedById,
  });

  try {
    await waitlistService.offerSlotToWaitlist({
      clinicId: appointment.clinicId,
      providerId: appointment.providerId,
      serviceId: appointment.serviceId,
      slotStartTime: appointment.startTime,
      slotEndTime: appointment.endTime,
      locationId: appointment.locationId,
    });
  } catch {
    // Best-effort: do not fail cancellation if waitlist offer fails
  }

  return {
    appointment: updated,
    lateCancellation: withinWindow,
    cancellationFee,
  };
};

export interface RescheduleAppointmentData {
  newStartTime: string | Date;
  newEndTime: string | Date;
}

export const rescheduleAppointment = async (
  oldAppointmentId: string,
  data: RescheduleAppointmentData,
  performedById: string,
  where: { clinicId?: string; patientId?: string; providerId?: string } = {}
) => {
  const oldAppointment = await prisma.appointment.findFirst({
    where: { id: oldAppointmentId, ...where },
    include: { service: true },
  });
  if (!oldAppointment) {
    const err = new Error('Appointment not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  if (oldAppointment.status === 'CANCELLED') {
    const err = new Error('Cannot reschedule a cancelled appointment') as ApiError;
    err.statusCode = 400;
    throw err;
  }
  if (oldAppointment.status === 'RESCHEDULED') {
    const err = new Error('Appointment has already been rescheduled') as ApiError;
    err.statusCode = 400;
    throw err;
  }
  const { newStartTime, newEndTime } = data;
  const createData: CreateAppointmentData = {
    locationId: oldAppointment.locationId,
    providerId: oldAppointment.providerId,
    serviceId: oldAppointment.serviceId,
    patientId: oldAppointment.patientId,
    startTime: newStartTime,
    endTime: newEndTime,
  };
  const newAppointment = await createAppointment(createData, oldAppointment.clinicId, {
    performedById,
    excludeAppointmentId: oldAppointmentId,
  });
  await prisma.$transaction([
    prisma.appointment.update({
      where: { id: oldAppointmentId },
      data: { status: 'RESCHEDULED', rescheduledToId: newAppointment.id },
    }),
    prisma.appointment.update({
      where: { id: newAppointment.id },
      data: { rescheduledFromId: oldAppointmentId },
    }),
  ]);
  const updatedOld = await prisma.appointment.findUnique({
    where: { id: oldAppointmentId },
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
      rescheduledTo: {
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
      },
    },
  });
  await auditService.logAudit({
    clinicId: oldAppointment.clinicId,
    entityType: 'Appointment',
    entityId: oldAppointmentId,
    action: 'APPOINTMENT_RESCHEDULED',
    fieldChanged: 'status',
    oldValue: { status: oldAppointment.status, appointmentId: oldAppointmentId },
    newValue: { status: 'RESCHEDULED', newAppointmentId: newAppointment.id },
    performedById,
  });
  return {
    oldAppointment: updatedOld,
    newAppointment,
  };
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
  where: { clinicId?: string; patientId?: string; providerId?: string } = {}
) => {
  return prisma.appointment.findFirst({
    where: { id, ...where } as { id: string; clinicId?: string; patientId?: string; providerId?: string },
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

export interface AppointmentTimelineEvent {
  timestamp: Date;
  action: string;
  performedById: string;
  details: { oldValue?: unknown; newValue?: unknown };
}

export const getAppointmentTimeline = async (
  appointmentId: string,
  where: { clinicId?: string; patientId?: string; providerId?: string } = {}
): Promise<{ appointmentId: string; events: AppointmentTimelineEvent[] }> => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, ...where },
    select: { id: true },
  });
  if (!appointment) {
    const err = new Error('Appointment not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      entityType: 'APPOINTMENT',
      entityId: appointmentId,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      createdAt: true,
      action: true,
      performedById: true,
      oldValue: true,
      newValue: true,
    },
  });

  const events: AppointmentTimelineEvent[] = logs.map((log) => ({
    timestamp: log.createdAt,
    action: log.action,
    performedById: log.performedById,
    details: {
      ...(log.oldValue != null && log.oldValue !== undefined && { oldValue: log.oldValue as unknown }),
      ...(log.newValue != null && log.newValue !== undefined && { newValue: log.newValue as unknown }),
    },
  }));

  return {
    appointmentId,
    events,
  };
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
