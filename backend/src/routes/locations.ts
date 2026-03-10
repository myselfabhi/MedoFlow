import { Router } from 'express';
import * as locationController from '../controllers/locationController';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(requireClinic);

router.post(
  '/',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  locationController.create
);
router.get('/', locationController.list);

export default router;
