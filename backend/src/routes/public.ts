import { Router } from 'express';
import * as publicController from '../controllers/publicController';

const router = Router();

router.get('/clinics', publicController.listClinics);
router.get('/clinics/:id', publicController.getClinic);
router.get('/clinics/:id/services', publicController.getClinicServices);
router.get('/clinics/:id/providers', publicController.getClinicProviders);
router.get('/clinics/:id/locations', publicController.getClinicLocations);
router.get('/patients/check', publicController.checkPatientExists);
router.get('/availability', publicController.getAvailability);

export default router;
