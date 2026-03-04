import { Router, Request, Response, NextFunction } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

const analyticsScope = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user!.role === 'SUPER_ADMIN') {
    req.bypassClinicScope = true;
    req.clinicId = req.query.clinicId as string;
  } else if (
    req.user!.role === 'CLINIC_ADMIN' ||
    req.user!.role === 'PROVIDER' ||
    req.user!.role === 'STAFF'
  ) {
    req.bypassClinicScope = false;
    req.clinicId = req.user!.clinicId;
  }
  next();
};

router.get(
  '/overview',
  authorize(Role.CLINIC_ADMIN, Role.SUPER_ADMIN, Role.PROVIDER, Role.STAFF),
  analyticsScope,
  analyticsController.getOverview
);

router.get(
  '/revenue-by-service',
  authorize(Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  analyticsScope,
  analyticsController.getRevenueByService
);

router.get(
  '/revenue-by-provider',
  authorize(Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  analyticsScope,
  analyticsController.getRevenueByProvider
);

router.get(
  '/appointments-by-discipline',
  authorize(Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  analyticsScope,
  analyticsController.getAppointmentsByDiscipline
);

export default router;
