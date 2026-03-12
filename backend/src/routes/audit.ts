import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import * as auditController from '../controllers/auditController';

const router = Router();

router.use(protect);
router.use(authorize(Role.SUPER_ADMIN));
router.use(requireClinic);

router.get('/', auditController.listLogs);

export default router;
