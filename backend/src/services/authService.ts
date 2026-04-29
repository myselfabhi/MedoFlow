import * as argon2 from 'argon2'
import prisma from '../config/prisma'
import { ApiError } from '../types/errors'

export interface RegisterBody {
  name: string
  email: string
  password: string
  // Optional. Carried through from the clinic page (`/clinic/[idOrSlug]`)
  // so a new patient is auto-linked to the clinic they signed up from.
  // Can be either a cuid or a slug; we resolve to the canonical cuid.
  clinicId?: string | null
}

const validateRegistration = (body: RegisterBody): void => {
  const { name, email, password } = body

  if (!name || !email || !password) {
    const err = new Error('Name, email, and password are required') as ApiError
    err.statusCode = 400
    throw err
  }
}

export const registerUser = async (body: RegisterBody) => {
  validateRegistration(body)

  const existingUser = await prisma.user.findUnique({
    where: { email: body.email.trim().toLowerCase() },
  })
  if (existingUser) {
    const err = new Error('Email already registered') as ApiError
    err.statusCode = 409
    throw err
  }

  const hashedPassword = await argon2.hash(body.password, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MB (OWASP recommended minimum)
    timeCost: 2,
    parallelism: 1,
  })

  // Resolve the optional clinic carry-through. Accepts either the cuid
  // or the public slug. Falls back silently to null if unknown so a bad
  // value never blocks signup.
  let resolvedClinicId: string | null = null
  if (body.clinicId) {
    const found = await prisma.clinic.findFirst({
      where: { isActive: true, OR: [{ id: body.clinicId }, { slug: body.clinicId }] },
      select: { id: true },
    })
    resolvedClinicId = found?.id ?? null
  }

  return prisma.user.create({
    data: {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'PATIENT',
      clinicId: resolvedClinicId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      clinicId: true,
      isActive: true,
      createdAt: true,
    },
  })
}
