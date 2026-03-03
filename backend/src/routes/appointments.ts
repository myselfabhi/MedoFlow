import { Router, Request, Response, NextFunction } from 'express';
import * as appointmentController from '../controllers/appointmentController';
import { protect, authorize } from '../middleware/auth';
import { enforceClinicScope } from '../middleware/clinicScope';
import { Role } from '@prisma/client';
import { ApiError } from '../types/errors';

const router = Router();

router.use(protect);

const appointmentCreateScope = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user!.role === 'SUPER_ADMIN') {
    req.bypassClinicScope = true;
    req.clinicId = (req.body?.clinicId as string) || null;
  } else if (req.user!.role === 'PATIENT') {
    req.bypassClinicScope = false;
    req.clinicId = (req.body?.clinicId as string) || null;
    if (!req.clinicId) {
      const err = new Error('Clinic ID is required') as ApiError;
      err.statusCode = 400;
      next(err);
      return;
    }
  } else if (req.user!.role === 'CLINIC_ADMIN') {
    req.bypassClinicScope = false;
    req.clinicId = req.user!.clinicId;
  } else {
    const err = new Error(
      'Only PATIENT, CLINIC_ADMIN, or SUPER_ADMIN can create appointments'
    ) as ApiError;
    err.statusCode = 403;
    next(err);
    return;
  }
  next();
};

router.post(
  '/',
  authorize(Role.PATIENT, Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  appointmentCreateScope,
  appointmentController.create
);

router.get(
  '/my',
  authorize(Role.PATIENT),
  (req: Request, _res: Response, next: NextFunction) => {
    req.bypassClinicScope = req.user!.role === 'SUPER_ADMIN';
    req.clinicId = (req.query?.clinicId as string) || req.user?.clinicId || null;
    next();
  },
  appointmentController.getMy
);

router.get(
  '/provider',
  authorize(Role.PROVIDER),
  (req: Request, _res: Response, next: NextFunction) => {
    req.bypassClinicScope = req.user!.role === 'SUPER_ADMIN';
    req.clinicId = (req.query?.clinicId as string) || req.user?.clinicId || null;
    next();
  },
  appointmentController.getProvider
);

router.get(
  '/clinic',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  enforceClinicScope,
  appointmentController.getClinic
);

router.get(
  '/:id/timeline',
  authorize(Role.PATIENT, Role.PROVIDER, Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'PATIENT') {
      req.bypassClinicScope = true;
      req.clinicId = null;
    } else if (req.user!.role === 'PROVIDER') {
      req.clinicId = req.user?.clinicId ?? null;
    } else {
      req.bypassClinicScope = req.user!.role === 'SUPER_ADMIN';
      req.clinicId = (req.query?.clinicId as string) || req.user?.clinicId || null;
    }
    next();
  },
  appointmentController.getTimeline
);

router.get(
  '/:id',
  authorize(Role.PATIENT, Role.PROVIDER, Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'PATIENT') {
      req.bypassClinicScope = true;
      req.clinicId = null;
    } else {
      req.bypassClinicScope = req.user!.role === 'SUPER_ADMIN';
      req.clinicId = (req.query?.clinicId as string) || req.user?.clinicId || null;
    }
    next();
  },
  appointmentController.getById
);

const statusUpdateScope = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user!.role === 'CLINIC_ADMIN' || req.user!.role === 'SUPER_ADMIN') {
    return enforceClinicScope(req, res, next);
  }
  next();
};

router.put(
  '/:id/status',
  authorize(Role.PATIENT, Role.PROVIDER, Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  statusUpdateScope,
  appointmentController.updateStatus
);

const cancelRescheduleScope = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user!.role === 'CLINIC_ADMIN') {
    req.clinicId = req.user!.clinicId ?? null;
  } else if (req.user!.role === 'PATIENT') {
    req.clinicId = null;
  }
  next();
};

router.post(
  '/:id/cancel',
  authorize(Role.PATIENT, Role.PROVIDER, Role.CLINIC_ADMIN),
  cancelRescheduleScope,
  appointmentController.cancel
);

router.post(
  '/:id/reschedule',
  authorize(Role.PATIENT, Role.PROVIDER, Role.CLINIC_ADMIN),
  cancelRescheduleScope,
  appointmentController.reschedule
);

export default router;
