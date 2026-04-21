import prisma from '../config/prisma'
import { ApiError } from '../types/errors'

export interface OnboardingStatus {
  completedAt: Date | null
  step: number
  checklist: {
    brand: boolean
    locations: boolean
    disciplines: boolean
    services: boolean
    providers: boolean
  }
  brand: {
    logoUrl: string | null
    primaryColor: string
    secondaryColor: string | null
    subdomain: string
  } | null
}

async function tenantIdFromClinic(clinicId: string): Promise<string> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { tenantId: true },
  })
  if (!clinic) {
    const err = new Error('Clinic not found') as ApiError
    err.statusCode = 404
    throw err
  }
  return clinic.tenantId
}

export async function getStatus(clinicId: string): Promise<OnboardingStatus> {
  const tenantId = await tenantIdFromClinic(clinicId)

  const [tenant, brand, locationCount, disciplineCount, serviceCount, providerCount] =
    await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { onboardingCompletedAt: true, onboardingStep: true },
      }),
      prisma.brand.findUnique({
        where: { tenantId },
        select: { logoUrl: true, primaryColor: true, secondaryColor: true, subdomain: true },
      }),
      prisma.location.count({ where: { clinicId, isActive: true } }),
      prisma.discipline.count({ where: { clinicId } }),
      prisma.service.count({ where: { clinicId } }),
      prisma.provider.count({ where: { clinicId } }),
    ])

  // Brand is considered "customized" when logo uploaded OR primary color changed from default
  const brandCustomized = Boolean(
    brand && (brand.logoUrl || (brand.primaryColor && brand.primaryColor !== '#6366f1'))
  )

  return {
    completedAt: tenant?.onboardingCompletedAt ?? null,
    step: tenant?.onboardingStep ?? 0,
    checklist: {
      brand: brandCustomized,
      locations: locationCount > 0,
      disciplines: disciplineCount > 0,
      services: serviceCount > 0,
      providers: providerCount > 0,
    },
    brand: brand ?? null,
  }
}

export async function setStep(clinicId: string, step: number): Promise<void> {
  if (!Number.isInteger(step) || step < 0 || step > 6) {
    const err = new Error('Invalid step') as ApiError
    err.statusCode = 400
    throw err
  }
  const tenantId = await tenantIdFromClinic(clinicId)
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { onboardingStep: step },
  })
}

export async function complete(clinicId: string): Promise<void> {
  const tenantId = await tenantIdFromClinic(clinicId)
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { onboardingCompletedAt: new Date() },
  })
}

export async function updateBrand(
  clinicId: string,
  data: { primaryColor?: string; secondaryColor?: string | null; logoUrl?: string | null }
): Promise<void> {
  const tenantId = await tenantIdFromClinic(clinicId)

  const updates: {
    primaryColor?: string
    secondaryColor?: string | null
    logoUrl?: string | null
  } = {}
  if (data.primaryColor !== undefined) {
    if (!/^#[0-9a-fA-F]{6}$/.test(data.primaryColor)) {
      const err = new Error('primaryColor must be a 6-digit hex like #6366f1') as ApiError
      err.statusCode = 400
      throw err
    }
    updates.primaryColor = data.primaryColor.toLowerCase()
  }
  if (data.secondaryColor !== undefined) {
    if (data.secondaryColor !== null && !/^#[0-9a-fA-F]{6}$/.test(data.secondaryColor)) {
      const err = new Error('secondaryColor must be a 6-digit hex') as ApiError
      err.statusCode = 400
      throw err
    }
    updates.secondaryColor = data.secondaryColor?.toLowerCase() ?? null
  }
  if (data.logoUrl !== undefined) {
    updates.logoUrl = data.logoUrl
  }

  await prisma.brand.update({
    where: { tenantId },
    data: updates,
  })
}
