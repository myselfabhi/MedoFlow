import { Router, Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import { validateRequest } from '../middleware/validateRequest';
import * as clinicController from '../controllers/clinicController';
import {
  clinicSetupSchema,
  clinicUpdateSchema,
  locationUpsertSchema,
} from '../validation/module1Schemas';

const router = Router();

router.use(protect);
router.use(authorize(Role.SUPER_ADMIN));

const setClinicFromUser = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  req.clinicId = req.user?.clinicId ?? null;
  next();
};

router.get('/current', clinicController.getCurrent);
router.post('/setup', validateRequest(clinicSetupSchema), clinicController.setup);
router.put(
  '/current',
  setClinicFromUser,
  requireClinic,
  validateRequest(clinicUpdateSchema),
  clinicController.update
);
router.put(
  '/current/launch-location',
  setClinicFromUser,
  requireClinic,
  validateRequest(locationUpsertSchema),
  clinicController.upsertLaunchLocation
);

export default router;
