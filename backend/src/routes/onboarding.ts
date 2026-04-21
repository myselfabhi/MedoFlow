import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler'
import { successResponse } from '../utils/apiResponse'
import { protect } from '../middleware/auth'
import { validateRequest } from '../middleware/validateRequest'
import * as onboardingService from '../services/onboardingService'
import { ApiError } from '../types/errors'

const router = Router()

const stepSchema = {
  body: z.object({
    step: z.number().int().min(0).max(6),
  }),
}

const brandSchema = {
  body: z.object({
    primaryColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional(),
    logoUrl: z.string().url().nullable().optional(),
  }),
}

function requireClinic(clinicId: string | null | undefined): string {
  if (!clinicId) {
    const err = new Error('User has no clinic assigned') as ApiError
    err.statusCode = 403
    throw err
  }
  return clinicId
}

router.get(
  '/status',
  protect,
  asyncHandler(async (req, res) => {
    const clinicId = requireClinic(req.user?.clinicId)
    const status = await onboardingService.getStatus(clinicId)
    successResponse(res, 200, 'Onboarding status', status)
  })
)

router.patch(
  '/step',
  protect,
  validateRequest(stepSchema),
  asyncHandler(async (req, res) => {
    const clinicId = requireClinic(req.user?.clinicId)
    await onboardingService.setStep(clinicId, req.body.step as number)
    successResponse(res, 200, 'Step saved', { step: req.body.step })
  })
)

router.patch(
  '/brand',
  protect,
  validateRequest(brandSchema),
  asyncHandler(async (req, res) => {
    const clinicId = requireClinic(req.user?.clinicId)
    await onboardingService.updateBrand(clinicId, req.body)
    const status = await onboardingService.getStatus(clinicId)
    successResponse(res, 200, 'Brand updated', status)
  })
)

router.post(
  '/complete',
  protect,
  asyncHandler(async (req, res) => {
    const clinicId = requireClinic(req.user?.clinicId)
    await onboardingService.complete(clinicId)
    successResponse(res, 200, 'Onboarding complete', { completedAt: new Date() })
  })
)

export default router
