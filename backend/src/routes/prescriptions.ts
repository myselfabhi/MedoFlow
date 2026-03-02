import { Router, Request, Response, NextFunction } from 'express';
import * as prescriptionController from '../controllers/prescriptionController';
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
  } else if (req.user!.role === 'PROVIDER') {
    req.bypassClinicScope = false;
    req.clinicId = req.user!.clinicId;
  } else if (req.user!.role === 'CLINIC_ADMIN') {
    req.bypassClinicScope = false;
    req.clinicId = req.user!.clinicId;
  }
  next();
};

router.post(
  '/',
  authorize(Role.PROVIDER),
  providerScope,
  prescriptionController.create
);
router.get(
  '/my',
  authorize(Role.PATIENT),
  (req: Request, _res: Response, next: NextFunction) => {
    req.bypassClinicScope = req.user!.role === 'SUPER_ADMIN';
    req.clinicId = (req.query?.clinicId as string) || req.user?.clinicId || null;
    next();
  },
  prescriptionController.getMy
);
router.get(
  '/provider',
  authorize(Role.PROVIDER),
  providerScope,
  prescriptionController.getProvider
);
router.get(
  '/clinic',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  enforceClinicScope,
  prescriptionController.listClinic
);

export default router;
