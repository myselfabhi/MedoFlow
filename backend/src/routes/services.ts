import { Router } from 'express';
import * as serviceController from '../controllers/serviceController';
import { protect, authorize } from '../middleware/auth';
import { enforceClinicScope } from '../middleware/clinicScope';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(enforceClinicScope);

router.post(
  '/',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  serviceController.create
);
router.get('/', serviceController.list);
router.put(
  '/:id',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  serviceController.update
);
router.delete(
  '/:id',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  serviceController.remove
);

export default router;
