import { Router } from 'express';
import * as disciplineController from '../controllers/disciplineController';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import { validateRequest } from '../middleware/validateRequest';
import { Role } from '@prisma/client';
import {
  disciplineCreateSchema,
  disciplineUpdateSchema,
} from '../validation/module1Schemas';

const router = Router();

router.use(protect);
router.use(requireClinic);

router.post(
  '/',
  authorize(Role.SUPER_ADMIN),
  validateRequest(disciplineCreateSchema),
  disciplineController.create
);
router.get(
  '/',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK, Role.PROVIDER),
  disciplineController.list
);
router.get(
  '/:id',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK, Role.PROVIDER),
  disciplineController.getById
);
router.put(
  '/:id',
  authorize(Role.SUPER_ADMIN),
  validateRequest(disciplineUpdateSchema),
  disciplineController.update
);
router.delete(
  '/:id',
  authorize(Role.SUPER_ADMIN),
  disciplineController.remove
);

export default router;
