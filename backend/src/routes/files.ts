import { Router } from 'express';
import * as fileController from '../controllers/fileController';
import { protect, authorize } from '../middleware/auth';
import { patientFileUpload } from '../config/multer';
import { requireClinic } from '../middleware/requireClinic';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(requireClinic);

router.post(
  '/upload',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  patientFileUpload.single('file'),
  fileController.upload
);

router.get(
  '/patient/:patientId',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  fileController.listByPatient
);

router.get(
  '/:id/download',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  fileController.download
);

router.delete(
  '/:id',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  fileController.remove
);

export default router;
