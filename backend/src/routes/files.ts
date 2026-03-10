import { Router } from 'express';
import * as fileController from '../controllers/fileController';
import { protect, authorize } from '../middleware/auth';
import { patientFileUpload } from '../config/multer';
import { requireClinic } from '../middleware/requireClinic';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

router.post(
  '/upload',
  requireClinic,
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  patientFileUpload.single('file'),
  fileController.upload
);

router.get(
  '/patient/me',
  authorize(Role.PATIENT),
  fileController.listMyFiles
);

router.get(
  '/patient/me/:id/download',
  authorize(Role.PATIENT),
  fileController.downloadMyFile
);

router.get(
  '/patient/:patientId',
  requireClinic,
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  fileController.listByPatient
);

router.get(
  '/:id/download',
  requireClinic,
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  fileController.download
);

router.delete(
  '/:id',
  requireClinic,
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  fileController.remove
);

export default router;
