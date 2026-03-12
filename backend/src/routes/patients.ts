import { Router } from 'express';
import { protect } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import * as patientController from '../controllers/patientController';
import { authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(requireClinic);

router.get(
  '/',
  authorize(Role.FRONT_DESK, Role.SUPER_ADMIN, Role.PROVIDER),
  patientController.listClinicPatients
);

router.get('/packages', authorize(Role.PATIENT), patientController.getMyPackages);
router.get('/entitlements', authorize(Role.PATIENT), patientController.getMyEntitlements);
router.get(
  '/:patientId/entitlements',
  authorize(Role.FRONT_DESK, Role.SUPER_ADMIN, Role.PROVIDER),
  patientController.getPatientEntitlements
);

export default router;
