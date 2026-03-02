import { Router } from 'express';
import * as disciplineController from '../controllers/disciplineController';
import { protect, authorize } from '../middleware/auth';
import { enforceClinicScope } from '../middleware/clinicScope';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(enforceClinicScope);

router.post(
  '/',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  disciplineController.create
);
router.get('/', disciplineController.list);
router.put(
  '/:id',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  disciplineController.update
);
router.delete(
  '/:id',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  disciplineController.remove
);

export default router;
