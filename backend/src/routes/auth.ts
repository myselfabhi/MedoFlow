import { Router } from 'express';
import * as authController from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { patientRegistrationSchema } from '../validation/module1Schemas';

const router = Router();

router.post('/register', validateRequest(patientRegistrationSchema), authController.register);
router.post('/login', authController.login);
router.post('/set-password', authController.setPassword);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.me);
router.post('/patient-tour-seen', protect, authController.markPatientTourSeen);

export default router;
