import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import * as commissionController from '../controllers/commissionController';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(requireClinic);

router.get('/rules', authorize(Role.SUPER_ADMIN), commissionController.getRules);
router.post('/rules', authorize(Role.SUPER_ADMIN), commissionController.createRule);
router.put('/rules/:id', authorize(Role.SUPER_ADMIN), commissionController.toggleRule);

// Records endpoint - accessible by PROVIDER (their own) and SUPER_ADMIN (all)
router.get('/records', authorize(Role.SUPER_ADMIN, Role.PROVIDER), commissionController.getRecords);
router.post('/mark-paid', authorize(Role.SUPER_ADMIN), commissionController.markAsPaid);

export default router;
