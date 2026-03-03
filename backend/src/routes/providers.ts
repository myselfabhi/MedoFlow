import { Router } from 'express';
import * as providerController from '../controllers/providerController';
import * as availabilityController from '../controllers/availabilityController';
import { protect, authorize } from '../middleware/auth';
import { enforceClinicScope } from '../middleware/clinicScope';
import { Role } from '@prisma/client';

const router = Router();

router.get(
  '/:id/availability',
  availabilityController.getProviderAvailability
);

router.use(protect);
router.use(enforceClinicScope);

router.post(
  '/',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  providerController.create
);
router.get('/', providerController.list);
router.get(
  '/:id/services',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  providerController.listServices
);
router.post(
  '/:id/services',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  providerController.addService
);
router.put(
  '/:id/services/:serviceId',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  providerController.updateService
);
router.delete(
  '/:id/services/:serviceId',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  providerController.removeService
);
router.get('/:id', providerController.getById);
router.post(
  '/:id/availability/preview',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  availabilityController.previewAvailabilityUpdate
);
router.post(
  '/:id/availability',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  availabilityController.createAvailability
);
router.put(
  '/:id/availability/:availabilityId',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  availabilityController.updateAvailability
);
router.post(
  '/:id/unavailability',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  availabilityController.createUnavailability
);
router.put(
  '/:id',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  providerController.update
);
router.delete(
  '/:id',
  authorize(Role.SUPER_ADMIN, Role.CLINIC_ADMIN),
  providerController.remove
);

export default router;
