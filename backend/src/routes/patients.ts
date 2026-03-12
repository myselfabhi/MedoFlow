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

router.get('/packages', patientController.getMyPackages);

export default router;
