import { Router } from 'express';
import * as serviceController from '../controllers/serviceController';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(requireClinic);

router.post(
  '/',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  serviceController.create
);
router.get('/', serviceController.list);
router.put(
  '/:id',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  serviceController.update
);
router.delete(
  '/:id',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  serviceController.remove
);

export default router;
