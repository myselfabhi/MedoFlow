import { Router } from 'express';
import * as providerController from '../controllers/providerController';
import * as availabilityController from '../controllers/availabilityController';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import { Role } from '@prisma/client';

const router = Router();

router.get(
  '/:id/availability',
  availabilityController.getProviderAvailability
);

router.use(protect);
router.use(requireClinic);

router.post(
  '/',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  providerController.create
);
router.get('/', providerController.list);
router.get(
  '/:id/services',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  providerController.listServices
);
router.post(
  '/:id/services',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  providerController.addService
);
router.put(
  '/:id/services/:serviceId',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  providerController.updateService
);
router.delete(
  '/:id/services/:serviceId',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  providerController.removeService
);
router.get('/:id', providerController.getById);
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
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  providerController.update
);
router.delete(
  '/:id',
  authorize(Role.SUPER_ADMIN, Role.FRONT_DESK),
  providerController.remove
);

export default router;
