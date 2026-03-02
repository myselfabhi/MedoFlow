import { Router } from 'express';
import * as authController from '../controllers/authController';
import { protect, optionalProtect } from '../middleware/auth';
import { enforceClinicScope } from '../middleware/clinicScope';

const router = Router();

router.post('/register', optionalProtect, authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', protect, enforceClinicScope, authController.me);

export default router;
