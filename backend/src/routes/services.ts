import { Router } from 'express';
import * as serviceController from '../controllers/serviceController';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import { validateRequest } from '../middleware/validateRequest';
import { Role } from '@prisma/client';
import {
  serviceCreateSchema,
  serviceUpdateSchema,
} from '../validation/module1Schemas';

const router = Router();

router.use(protect);
router.use(requireClinic);

router.post(
  '/',
  authorize(Role.SUPER_ADMIN),
  validateRequest(serviceCreateSchema),
  serviceController.create
);
router.get(
  '/',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK, Role.PROVIDER),
  serviceController.list
);
router.put(
  '/:id',
  authorize(Role.SUPER_ADMIN),
  validateRequest(serviceUpdateSchema),
  serviceController.update
);
router.delete(
  '/:id',
  authorize(Role.SUPER_ADMIN),
  serviceController.remove
);

export default router;
