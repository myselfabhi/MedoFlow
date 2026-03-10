import { Router } from 'express';
import * as providerController from '../controllers/providerController';
import * as availabilityController from '../controllers/availabilityController';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import { validateRequest } from '../middleware/validateRequest';
import { Role } from '@prisma/client';
import {
  providerCreateSchema,
  providerServiceCreateSchema,
  providerServiceUpdateSchema,
  providerUpdateSchema,
} from '../validation/module1Schemas';

const router = Router();

router.get(
  '/:id/availability',
  availabilityController.getProviderAvailability
);

router.use(protect);
router.use(requireClinic);

router.post(
  '/',
  authorize(Role.SUPER_ADMIN),
  validateRequest(providerCreateSchema),
  providerController.create
);
router.get(
  '/',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK, Role.PROVIDER),
  providerController.list
);
router.get(
  '/:id/services',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK, Role.PROVIDER),
  providerController.listServices
);
router.post(
  '/:id/services',
  authorize(Role.SUPER_ADMIN),
  validateRequest(providerServiceCreateSchema),
  providerController.addService
);
router.put(
  '/:id/services/:serviceId',
  authorize(Role.SUPER_ADMIN),
  validateRequest(providerServiceUpdateSchema),
  providerController.updateService
);
router.delete(
  '/:id/services/:serviceId',
  authorize(Role.SUPER_ADMIN),
  providerController.removeService
);
router.get(
  '/:id',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK, Role.PROVIDER),
  providerController.getById
);
router.post(
  '/:id/availability/preview',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  availabilityController.previewAvailabilityUpdate
);
router.post(
  '/:id/availability',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  availabilityController.createAvailability
);
router.put(
  '/:id/availability/:availabilityId',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  availabilityController.updateAvailability
);
router.post(
  '/:id/unavailability',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  availabilityController.createUnavailability
);
router.put(
  '/:id',
  authorize(Role.SUPER_ADMIN),
  validateRequest(providerUpdateSchema),
  providerController.update
);
router.delete(
  '/:id',
  authorize(Role.SUPER_ADMIN),
  providerController.remove
);

export default router;
