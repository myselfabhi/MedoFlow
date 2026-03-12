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
router.delete('/:id', staffController.deactivateStaff);
// Removed strict validation here because schemas differ between PROVIDER and FRONT_DESK.
// Schema validation should be handled in the controller or conditionally via middleware.
router.post('/', staffController.createStaff);

export default router;
