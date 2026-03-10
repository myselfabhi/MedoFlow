import { Router } from 'express';
import * as treatmentPlanController from '../controllers/treatmentPlanController';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(requireClinic);

router.post(
  '/',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  treatmentPlanController.create
);

router.get(
  '/',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  treatmentPlanController.getList
);

router.get(
  '/patient/:patientId',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  treatmentPlanController.getByPatient
);

router.get(
  '/:id',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  treatmentPlanController.getById
);

router.put(
  '/:id',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  treatmentPlanController.update
);

router.put(
  '/:id/complete',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  treatmentPlanController.complete
);

router.put(
  '/:id/discontinue',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  treatmentPlanController.discontinue
);

export default router;
