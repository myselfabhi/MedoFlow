import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import * as commissionController from '../controllers/commissionController';

const router = Router();

router.use(protect);

router.get('/rules', authorize('SUPER_ADMIN'), commissionController.getRules);
router.post('/rules', authorize('SUPER_ADMIN'), commissionController.createRule);
router.put('/rules/:id', authorize('SUPER_ADMIN'), commissionController.toggleRule);

// Records endpoint - accessible by PROVIDER (their own) and SUPER_ADMIN (all)
router.get('/records', authorize('SUPER_ADMIN', 'PROVIDER'), commissionController.getRecords);
router.post('/mark-paid', authorize('SUPER_ADMIN'), commissionController.markAsPaid);

export default router;
