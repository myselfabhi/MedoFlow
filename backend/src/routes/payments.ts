import { Router, Request, Response, NextFunction } from 'express';
import * as paymentController from '../controllers/paymentController';
import { protect, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

const setClinicFromUser = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  req.clinicId = req.user?.clinicId ?? null;
  next();
};

router.post(
  '/:appointmentId/confirm',
  authorize(Role.PATIENT, Role.FRONT_DESK),
  setClinicFromUser,
  paymentController.confirm
);

router.post(
  '/:appointmentId/fail',
  authorize(Role.PATIENT, Role.FRONT_DESK),
  setClinicFromUser,
  paymentController.fail
);

export default router;
