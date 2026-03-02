import { Router } from 'express';
import * as locationController from '../controllers/locationController';
import { protect, authorize } from '../middleware/auth';
import { enforceClinicScope } from '../middleware/clinicScope';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(enforceClinicScope);

router.post(
  '/',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  locationController.create
);
router.get('/', locationController.list);

export default router;
