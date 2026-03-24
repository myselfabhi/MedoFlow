import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import { validateRequest } from '../middleware/validateRequest';
import * as staffController from '../controllers/staffController';
import { frontDeskProvisionSchema } from '../validation/module1Schemas';

const router = Router();

router.use(protect);
router.use(authorize(Role.SUPER_ADMIN, Role.FRONT_DESK));
router.use(requireClinic);

router.get('/', staffController.listAllStaff);
router.post('/', staffController.createStaff);
router.patch('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deactivateStaff);
router.post('/:id/link-provider', staffController.linkProviderToAdmin);

export default router;
