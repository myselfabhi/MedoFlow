import { Router } from 'express';
import * as consultationController from '../controllers/consultationController';
import { protect, authorize, optionalProtect } from '../middleware/auth';
import { audioUpload } from '../config/audioUpload';
import { requireClinic } from '../middleware/requireClinic';
import { Role } from '@prisma/client';

const router = Router();

// --- Public: patient join by token (optional auth for logged-in patients) ---
router.get(
    '/join/:token',
    optionalProtect,
    consultationController.joinByToken
);

// --- All below require authentication ---
router.use(protect);

// --- Start consultation from appointment (provider only, needs clinic) ---
// Note: This route is mounted at /consultations but the appointment start
// is also accessible via /appointments/:id/consultation/start (see appointmentConsultationRouter)
router.get(
    '/appointment/:appointmentId',
    authorize(Role.PROVIDER, Role.PATIENT),
    consultationController.getByAppointment
);

// --- Patient consent ---
router.post(
    '/:id/consent',
    authorize(Role.PATIENT),
    consultationController.grantConsent
);

// --- Provider recording controls ---
router.post(
    '/:id/recording/start',
    requireClinic,
    authorize(Role.PROVIDER),
    consultationController.startRecording
);

router.post(
    '/:id/recording/stop',
    requireClinic,
    authorize(Role.PROVIDER),
    consultationController.stopRecording
);

router.post(
    '/:id/recording/upload',
    requireClinic,
    authorize(Role.PROVIDER),
    audioUpload.single('audio'),
    consultationController.uploadRecording
);

// --- Transcription ---
router.post(
    '/:id/transcribe',
    requireClinic,
    authorize(Role.PROVIDER),
    consultationController.startTranscription
);

router.get(
    '/:id/transcript',
    requireClinic,
    authorize(Role.PROVIDER),
    consultationController.getTranscript
);

// --- Convert to template ---
router.post(
    '/:id/convert-to-template',
    requireClinic,
    authorize(Role.PROVIDER),
    consultationController.convertToTemplate
);

// --- Get session by ID (provider or patient) ---
router.get(
    '/:id',
    authorize(Role.PROVIDER, Role.PATIENT),
    consultationController.getSession
);

export default router;

// Separate router for appointment-scoped start
export const appointmentConsultationRouter = Router();
appointmentConsultationRouter.use(protect);
appointmentConsultationRouter.use(requireClinic);

appointmentConsultationRouter.post(
    '/:id/consultation/start',
    authorize(Role.PROVIDER),
    consultationController.startSession
);
