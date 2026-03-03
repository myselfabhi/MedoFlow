import { Router, Request, Response, NextFunction } from 'express';
import * as paymentController from '../controllers/paymentController';
import { protect, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

const paymentScope = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user!.role === 'PATIENT') {
    req.clinicId = null;
  } else if (req.user!.role === 'CLINIC_ADMIN') {
    req.clinicId = req.user!.clinicId ?? null;
  }
  next();
};

router.post(
  '/:appointmentId/confirm',
  authorize(Role.PATIENT, Role.CLINIC_ADMIN),
  paymentScope,
  paymentController.confirm
);

router.post(
  '/:appointmentId/fail',
  authorize(Role.PATIENT, Role.CLINIC_ADMIN),
  paymentScope,
  paymentController.fail
);

export default router;
