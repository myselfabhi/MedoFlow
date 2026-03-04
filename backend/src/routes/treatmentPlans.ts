import { Router, Request, Response, NextFunction } from 'express';
import * as treatmentPlanController from '../controllers/treatmentPlanController';
import { protect, authorize } from '../middleware/auth';
import { enforceClinicScope } from '../middleware/clinicScope';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(enforceClinicScope);

router.post(
  '/',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'SUPER_ADMIN') {
      req.bypassClinicScope = true;
      req.clinicId = (req.body?.clinicId as string) || req.query?.clinicId as string || null;
    }
    next();
  },
  treatmentPlanController.create
);

router.get(
  '/',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'SUPER_ADMIN') {
      req.bypassClinicScope = true;
      req.clinicId = (req.query?.clinicId as string) || null;
    }
    next();
  },
  treatmentPlanController.getList
);

router.get(
  '/patient/:patientId',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'SUPER_ADMIN') {
      req.bypassClinicScope = true;
      req.clinicId = (req.query?.clinicId as string) || null;
    }
    next();
  },
  treatmentPlanController.getByPatient
);

router.get(
  '/:id',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'SUPER_ADMIN') {
      req.bypassClinicScope = true;
      req.clinicId = (req.query?.clinicId as string) || null;
    }
    next();
  },
  treatmentPlanController.getById
);

router.put(
  '/:id',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'SUPER_ADMIN') {
      req.bypassClinicScope = true;
      req.clinicId = (req.body?.clinicId as string) || (req.query?.clinicId as string) || null;
    }
    next();
  },
  treatmentPlanController.update
);

router.put(
  '/:id/complete',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'SUPER_ADMIN') {
      req.bypassClinicScope = true;
      req.clinicId = (req.query?.clinicId as string) || null;
    }
    next();
  },
  treatmentPlanController.complete
);

router.put(
  '/:id/discontinue',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'SUPER_ADMIN') {
      req.bypassClinicScope = true;
      req.clinicId = (req.query?.clinicId as string) || null;
    }
    next();
  },
  treatmentPlanController.discontinue
);

export default router;
