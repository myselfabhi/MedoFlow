import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import * as membershipController from '../controllers/membershipController';

const router = Router();

router.use(protect);

router.get('/', membershipController.getAll);
router.get('/summary', authorize('SUPER_ADMIN', 'FRONT_DESK'), membershipController.getOperationalSummary);
router.get('/subscriptions/me', authorize('PATIENT'), membershipController.getMySubscriptions);
router.get('/:id', membershipController.getById);
router.post('/:id/purchase', authorize('PATIENT'), membershipController.purchase);
router.post(
  '/subscriptions/:subscriptionId/cancel',
  authorize('PATIENT'),
  membershipController.cancelAtPeriodEnd
);

router.post('/', authorize('SUPER_ADMIN'), membershipController.create);
router.put('/:id', authorize('SUPER_ADMIN'), membershipController.update);
router.delete('/:id', authorize('SUPER_ADMIN'), membershipController.remove);

export default router;
