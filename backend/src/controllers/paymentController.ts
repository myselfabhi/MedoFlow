import { Request, Response, NextFunction } from 'express';
import * as paymentService from '../services/paymentService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const getPaymentWhere = async (
  req: Request
): Promise<{ clinicId?: string; patientId?: string }> => {
  if (req.user!.role === 'PATIENT') return { patientId: req.user!.id };
  if (req.user!.role === 'CLINIC_ADMIN' && req.clinicId)
    return { clinicId: req.clinicId };
  return {};
};

export const confirm = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const appointmentId = req.params.appointmentId as string;
    const where = await getPaymentWhere(req);
    const result = await paymentService.confirmPayment(
      appointmentId,
      req.user!.id,
      where
    );
    successResponse(res, 200, 'Payment confirmed', {
      payment: result.payment,
      appointment: result.appointment,
    });
  }
);

export const fail = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const appointmentId = req.params.appointmentId as string;
    const where = await getPaymentWhere(req);
    const result = await paymentService.failPayment(
      appointmentId,
      req.user!.id,
      where
    );
    successResponse(res, 200, 'Payment recorded as failed', {
      payment: result.payment,
      appointment: result.appointment,
    });
  }
);
