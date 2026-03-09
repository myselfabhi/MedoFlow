import { Router, Request, Response, NextFunction } from 'express';
import * as aiScribeController from '../controllers/aiScribeController';
import { protect, authorize } from '../middleware/auth';
import { audioUpload } from '../config/audioUpload';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

const providerScope = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user!.role === 'SUPER_ADMIN') {
    req.bypassClinicScope = true;
    req.clinicId =
      (req.body?.clinicId as string) ||
      (req.query?.clinicId as string) ||
      null;
  } else if (req.user!.role === 'PROVIDER' || req.user!.role === 'CLINIC_ADMIN') {
    req.bypassClinicScope = false;
    req.clinicId = req.user!.clinicId;
  }
  next();
};

router.post(
  '/session/start',
  authorize(Role.PROVIDER),
  providerScope,
  aiScribeController.startSession
);

router.get(
  '/session/visit/:visitRecordId',
  authorize(Role.PROVIDER),
  providerScope,
  aiScribeController.getByVisitRecord
);

router.get(
  '/session/:id/status',
  authorize(Role.PROVIDER),
  providerScope,
  aiScribeController.getSessionStatus
);

router.get(
  '/session/:id',
  authorize(Role.PROVIDER),
  providerScope,
  aiScribeController.getSession
);

router.post(
  '/session/:id/audio',
  authorize(Role.PROVIDER),
  providerScope,
  audioUpload.single('audio'),
  aiScribeController.uploadAudio
);

router.post(
  '/session/:id/process',
  authorize(Role.PROVIDER),
  providerScope,
  aiScribeController.process
);

router.put(
  '/session/:id/draft',
  authorize(Role.PROVIDER),
  providerScope,
  aiScribeController.updateDraft
);

router.post(
  '/session/:id/regenerate',
  authorize(Role.PROVIDER),
  providerScope,
  aiScribeController.regenerateDraft
);

router.post(
  '/session/:id/approve',
  authorize(Role.PROVIDER),
  providerScope,
  aiScribeController.approve
);

export default router;
