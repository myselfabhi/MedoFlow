import { Router, Request, Response, NextFunction } from 'express';
import * as formController from '../controllers/formController';
import { protect, authorize } from '../middleware/auth';
import { enforceClinicScope } from '../middleware/clinicScope';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

const templateScope = (
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
  } else if (req.user!.role === 'CLINIC_ADMIN') {
    req.bypassClinicScope = false;
    req.clinicId = req.user!.clinicId;
  }
  next();
};

const responseScope = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user!.role === 'SUPER_ADMIN') {
    req.bypassClinicScope = true;
    req.clinicId = (req.query?.clinicId as string) || null;
  } else if (
    req.user!.role === 'PROVIDER' ||
    req.user!.role === 'CLINIC_ADMIN'
  ) {
    req.bypassClinicScope = false;
    req.clinicId = req.user!.clinicId;
  }
  next();
};

router.post(
  '/templates',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  templateScope,
  enforceClinicScope,
  formController.createTemplate
);

router.get(
  '/templates',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  templateScope,
  enforceClinicScope,
  formController.listTemplates
);

router.put(
  '/templates/:id',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  templateScope,
  enforceClinicScope,
  formController.updateTemplate
);

router.delete(
  '/templates/:id',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  templateScope,
  enforceClinicScope,
  formController.disableTemplate
);

router.post(
  '/respond',
  authorize(Role.PATIENT),
  formController.submitResponse
);

router.get(
  '/patient/:patientId',
  authorize(Role.PROVIDER, Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  responseScope,
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'SUPER_ADMIN' && !req.clinicId) {
      req.clinicId = req.query.clinicId as string;
    }
    next();
  },
  formController.getResponsesByPatient
);

export default router;
