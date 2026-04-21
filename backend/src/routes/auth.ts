import { Router } from 'express'
import * as authController from '../controllers/authController'
import { protect } from '../middleware/auth'
import { validateRequest } from '../middleware/validateRequest'
import { patientRegistrationSchema } from '../validation/module1Schemas'
import { authRateLimit } from '../middleware/rateLimit'

const router = Router()

router.post(
  '/register',
  authRateLimit,
  validateRequest(patientRegistrationSchema),
  authController.register
)
router.post('/login', authRateLimit, authController.login)
router.post('/set-password', authRateLimit, authController.setPassword)
router.post('/refresh-token', authRateLimit, authController.refreshToken)
router.post('/logout', authController.logout)
router.get('/me', protect, authController.me)
router.patch('/me', protect, authController.updateMe)

export default router
