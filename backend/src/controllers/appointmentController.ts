import { Request, Response, NextFunction } from 'express';
import * as appointmentService from '../services/appointmentService';
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
    const { patientId, ...rest } = req.body;
    const resolvedPatientId = (patientId as string) || req.user!.id;
    const appointment = await appointmentService.createAppointment(
      { ...rest, patientId: resolvedPatientId },
      clinicId
    );
    successResponse(res, 201, 'Appointment created', { appointment });
  }
);

export const getMy = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.bypassClinicScope
      ? (req.query.clinicId as string)
      : req.clinicId;
    const appointments = await appointmentService.getAppointmentsByPatient(
      req.user!.id,
      clinicId
    );
    successResponse(res, 200, 'Appointments retrieved', { appointments });
  }
);

export const getProvider = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const provider = await appointmentService.getProviderByUserId(req.user!.id);
    if (!provider) {
      const err = new Error('Provider profile not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    const clinicId = req.bypassClinicScope
      ? (req.query.clinicId as string)
      : req.clinicId;
    const appointments = await appointmentService.getAppointmentsByProvider(
      provider.id,
      clinicId
    );
    successResponse(res, 200, 'Appointments retrieved', { appointments });
  }
);

export const getClinic = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.bypassClinicScope
      ? (req.query.clinicId as string)
      : req.clinicId;
    if (!clinicId) {
      const err = new Error('Clinic ID is required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const appointments = await appointmentService.getAppointmentsByClinic(
      clinicId
    );
    successResponse(res, 200, 'Appointments retrieved', { appointments });
  }
);

export const updateStatus = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const id = req.params.id as string;
    const { status } = req.body;
    if (!status) {
      const err = new Error('Status is required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const validStatuses: string[] = [
      'DRAFT',
      'PENDING_PAYMENT',
      'CONFIRMED',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
      'RESCHEDULED',
    ];
    if (!validStatuses.includes(status as string)) {
      const err = new Error('Invalid status') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const appointment = await appointmentService.updateAppointmentStatus(
      id,
      status as import('@prisma/client').AppointmentStatus,
      req
    );
    successResponse(res, 200, 'Appointment status updated', { appointment });
  }
);
