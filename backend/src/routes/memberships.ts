import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import * as membershipController from '../controllers/membershipController';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(requireClinic);

router.get('/', membershipController.getAll);
router.get('/summary', authorize(Role.SUPER_ADMIN, Role.FRONT_DESK), membershipController.getOperationalSummary);
router.get('/subscriptions/me', authorize(Role.PATIENT), membershipController.getMySubscriptions);
router.get('/:id', membershipController.getById);
router.post('/:id/purchase', authorize(Role.PATIENT), membershipController.purchase);
router.post(
  '/subscriptions/:subscriptionId/cancel',
  authorize(Role.PATIENT),
  membershipController.cancelAtPeriodEnd
);

router.post('/', authorize(Role.SUPER_ADMIN), membershipController.create);
router.put('/:id', authorize(Role.SUPER_ADMIN), membershipController.update);
router.delete('/:id', authorize(Role.SUPER_ADMIN), membershipController.remove);

export default router;
