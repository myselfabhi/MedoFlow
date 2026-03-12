import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(requireClinic);

router.get(
  '/overview',
  authorize(Role.FRONT_DESK, Role.SUPER_ADMIN, Role.PROVIDER),
  analyticsController.getOverview
);

router.get(
  '/revenue-by-service',
  authorize(Role.FRONT_DESK, Role.SUPER_ADMIN),
  analyticsController.getRevenueByService
);

router.get(
  '/revenue-by-provider',
  authorize(Role.FRONT_DESK, Role.SUPER_ADMIN),
  analyticsController.getRevenueByProvider
);

router.get(
  '/appointments-by-discipline',
  authorize(Role.FRONT_DESK, Role.SUPER_ADMIN),
  analyticsController.getAppointmentsByDiscipline
);

router.get(
  '/commerce',
  authorize(Role.FRONT_DESK, Role.SUPER_ADMIN),
  analyticsController.getCommerceAnalytics
);

router.get(
  '/memberships',
  authorize(Role.FRONT_DESK, Role.SUPER_ADMIN),
  analyticsController.getMembershipAnalytics
);

router.get(
  '/export',
  authorize(Role.FRONT_DESK, Role.SUPER_ADMIN),
  analyticsController.exportReport
);

export default router;
