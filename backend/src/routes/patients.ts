import { Router } from 'express';
import { protect } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import * as patientController from '../controllers/patientController';

const router = Router();

router.use(protect);
router.use(requireClinic);

router.get('/packages', patientController.getMyPackages);

export default router;
