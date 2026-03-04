import { Router, Request, Response, NextFunction } from 'express';
import * as fileController from '../controllers/fileController';
import { protect, authorize } from '../middleware/auth';
import { patientFileUpload } from '../config/multer';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

const fileScope = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.user!.role === 'SUPER_ADMIN') {
    req.bypassClinicScope = true;
    req.clinicId =
      (req.body?.clinicId as string) || (req.query?.clinicId as string) || null;
  } else if (req.user!.role === 'PROVIDER' || req.user!.role === 'CLINIC_ADMIN') {
    req.bypassClinicScope = false;
    req.clinicId = req.user!.clinicId;
  }
  next();
};

router.post(
  '/upload',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  patientFileUpload.single('file'),
  fileScope,
  fileController.upload
);

router.get(
  '/patient/:patientId',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  fileScope,
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'SUPER_ADMIN' && !req.clinicId) {
      req.clinicId = req.query.clinicId as string;
    }
    next();
  },
  fileController.listByPatient
);

router.get(
  '/:id/download',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  fileScope,
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'SUPER_ADMIN' && !req.clinicId) {
      req.clinicId = req.query.clinicId as string;
    }
    next();
  },
  fileController.download
);

router.delete(
  '/:id',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  fileScope,
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'SUPER_ADMIN' && !req.clinicId) {
      req.clinicId = req.query.clinicId as string;
    }
    next();
  },
  fileController.remove
);

export default router;
