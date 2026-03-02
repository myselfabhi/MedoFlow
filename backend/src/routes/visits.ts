import { Router, Request, Response, NextFunction } from 'express';
import * as visitController from '../controllers/visitController';
import { protect, authorize } from '../middleware/auth';
import { enforceClinicScope } from '../middleware/clinicScope';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

const providerScope = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user!.role === 'SUPER_ADMIN') {
    req.bypassClinicScope = true;
    req.clinicId =
      (req.body?.clinicId as string) ||
      (req.query?.clinicId as string) ||
      null;
  } else if (req.user!.role === 'PROVIDER' || req.user!.role === 'CLINIC_ADMIN') {
    req.bypassClinicScope = false;
    req.clinicId = req.user!.clinicId;
  }
  next();
};

router.post(
  '/',
  authorize(Role.PROVIDER),
  providerScope,
  visitController.create
);
const visitGetScope = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user!.role === 'SUPER_ADMIN') {
    req.bypassClinicScope = true;
    req.clinicId =
      (req.body?.clinicId as string) ||
      (req.query?.clinicId as string) ||
      null;
  } else if (req.user!.role === 'PROVIDER' || req.user!.role === 'CLINIC_ADMIN') {
    req.bypassClinicScope = false;
    req.clinicId = req.user!.clinicId;
  } else if (req.user!.role === 'PATIENT') {
    req.bypassClinicScope = true;
    req.clinicId = (req.query?.clinicId as string) || null;
  }
  next();
};

router.get(
  '/appointment/:appointmentId',
  authorize(Role.PROVIDER, Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.PATIENT),
  visitGetScope,
  visitController.getByAppointment
);
router.put(
  '/:id',
  authorize(Role.PROVIDER),
  providerScope,
  visitController.update
);
router.put(
  '/:id/finalize',
  authorize(Role.PROVIDER),
  providerScope,
  visitController.finalize
);
router.get(
  '/clinic',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  enforceClinicScope,
  visitController.listClinic
);

export default router;
