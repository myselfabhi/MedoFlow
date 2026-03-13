import { Router } from 'express';
import * as publicController from '../controllers/publicController';
import { validateRequest } from '../middleware/validateRequest';
import {
  publicAvailabilitySchema,
  publicSlotHoldSchema,
} from '../validation/module2Schemas';

const router = Router();

router.get('/clinics', publicController.listClinics);
router.get('/clinics/:id', publicController.getClinic);
router.get('/clinics/:id/services', publicController.getClinicServices);
router.get('/clinics/:id/providers', publicController.getClinicProviders);
router.get('/clinics/:id/locations', publicController.getClinicLocations);
router.get('/clinics/:id/products', publicController.getClinicProducts);
router.get('/clinics/:id/packages', publicController.getClinicPackages);
router.get('/clinics/:id/memberships', publicController.getClinicMemberships);
router.get('/products/:id', publicController.getProduct);
router.get('/patients/check', publicController.checkPatientExists);
router.get('/availability', validateRequest(publicAvailabilitySchema), publicController.getAvailability);
router.post('/slots/hold', validateRequest(publicSlotHoldSchema), publicController.createSlotHold);
router.delete('/slots/hold/:holdId', publicController.releaseSlotHold);

export default router;
