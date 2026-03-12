import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(requireClinic);

router.get(
  '/dashboard',
  authorize(Role.FRONT_DESK, Role.SUPER_ADMIN, Role.PROVIDER),
  analyticsController.getDashboard
);

router.get(
  '/provider-self',
  authorize(Role.PROVIDER),
  analyticsController.getProviderSelf
);

router.get(
  '/export',
  authorize(Role.FRONT_DESK, Role.SUPER_ADMIN, Role.PROVIDER),
  analyticsController.exportReport
);

export default router;
