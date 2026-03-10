import { Router } from 'express';
import * as disciplineController from '../controllers/disciplineController';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(requireClinic);

router.post(
  '/',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  disciplineController.create
);
router.get('/', disciplineController.list);
router.get('/:id', disciplineController.getById);
router.put(
  '/:id',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  disciplineController.update
);
router.delete(
  '/:id',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  disciplineController.remove
);

export default router;
