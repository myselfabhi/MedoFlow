import * as argon2 from 'argon2'
import { Request, Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { successResponse } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import * as authService from '../services/authService'
import * as passwordSetupService from '../services/passwordSetupService'
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} from '../utils/tokenUtils'
import { ApiError } from '../types/errors'

const REFRESH_TOKEN_COOKIE = 'refreshToken'

const setRefreshTokenCookie = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === 'production'
  const crossOrigin = Boolean(process.env.CORS_ORIGIN)
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax', // Use lax for local dev to allow cross-port requests
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/', // Ensure it's sent for all requests
  })
}

const clearRefreshTokenCookie = (res: Response): void => {
  const crossOrigin = Boolean(process.env.CORS_ORIGIN)
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
  })
}

export const register = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const user = await authService.registerUser(req.body)
    successResponse(res, 201, 'Registration successful', { user })
  }
)

export const login = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customRole: { select: { id: true, name: true, permissions: true } },
      },
    })
    if (!user) {
      const err = new Error('Invalid email or password') as ApiError
      err.statusCode = 401
      throw err
    }

    if (!user.isActive) {
      const err = new Error('Account is deactivated') as ApiError
      err.statusCode = 403
      throw err
    }

    const hashedPassword = await argon2.verify(user.password, password as string)
    if (!hashedPassword) {
      const err = new Error('Invalid email or password') as ApiError
      err.statusCode = 401
      throw err
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      clinicId: user.clinicId,
      role: user.role,
    })

    const refreshToken = generateRefreshToken()
    const hashedRefreshToken = hashToken(refreshToken)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedRefreshToken,
        expiresAt: getRefreshTokenExpiry(),
      },
    })

    setRefreshTokenCookie(res, refreshToken)

    // Resolve effective permissions
    let permissions: string[] = []
    if (user.role === 'PLATFORM_ADMIN' || user.role === 'SUPER_ADMIN') {
      permissions = ['*']
    } else if (user.customRole?.permissions) {
      permissions = user.customRole.permissions as string[]
    }

    successResponse(res, 200, 'Login successful', {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        customRoleId: user.customRoleId,
        customRoleName: user.customRole?.name ?? null,
        permissions,
      },
    })
  }
)

export const refreshToken = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE]

    if (!token) {
      const err = new Error('Refresh token required') as ApiError
      err.statusCode = 401
      throw err
    }

    const hashedToken = hashToken(token)

    const storedToken = await prisma.refreshToken.findFirst({
      where: { token: hashedToken },
      include: { user: true },
    })

    if (!storedToken) {
      const err = new Error('Invalid refresh token') as ApiError
      err.statusCode = 401
      throw err
    }

    if (storedToken.revoked) {
      // Token reuse detected — this indicates a stolen token.
      // Revoke ALL refresh tokens for this user (nuclear option).
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, revoked: false },
        data: { revoked: true },
      })
      clearRefreshTokenCookie(res)
      const err = new Error(
        'Security alert: refresh token reuse detected. All sessions revoked. Please log in again.'
      ) as ApiError
      err.statusCode = 401
      throw err
    }

    if (new Date() > storedToken.expiresAt) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      })
      const err = new Error('Refresh token expired') as ApiError
      err.statusCode = 401
      throw err
    }

    if (!storedToken.user.isActive) {
      const err = new Error('Account is deactivated') as ApiError
      err.statusCode = 403
      throw err
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    })

    const newRefreshToken = generateRefreshToken()
    const hashedNewRefreshToken = hashToken(newRefreshToken)

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.userId,
        token: hashedNewRefreshToken,
        expiresAt: getRefreshTokenExpiry(),
      },
    })

    setRefreshTokenCookie(res, newRefreshToken)

    const accessToken = generateAccessToken({
      userId: storedToken.user.id,
      clinicId: storedToken.user.clinicId,
      role: storedToken.user.role,
    })

    successResponse(res, 200, 'Token refreshed', { accessToken })
  }
)

export const logout = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE]

    if (token) {
      const hashedToken = hashToken(token)
      await prisma.refreshToken.updateMany({
        where: { token: hashedToken },
        data: { revoked: true },
      })
    }

    clearRefreshTokenCookie(res)
    successResponse(res, 200, 'Logged out successfully')
  }
)

export const me = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    if (!req.user?.id) {
      const err = new Error('Not authenticated') as ApiError
      err.statusCode = 401
      throw err
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clinicId: true,
        customRoleId: true,
        customRole: { select: { id: true, name: true, permissions: true } },
        permissions: true,
        hasSeenTour: true,
        tourCompletedAt: true,
        preferences: true,
        clinic: {
          select: {
            id: true,
            name: true,
            tenant: {
              select: {
                id: true,
                name: true,
                onboardingCompletedAt: true,
                onboardingStep: true,
              },
            },
          },
        },
      },
    })
    successResponse(res, 200, 'User retrieved', { user })
  }
)

const ALLOWED_UPDATE_KEYS = new Set(['name', 'hasSeenTour', 'preferences'])

export const updateMe = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    if (!req.user?.id) {
      const err = new Error('Not authenticated') as ApiError
      err.statusCode = 401
      throw err
    }

    const body = (req.body ?? {}) as Record<string, unknown>
    const updates: {
      name?: string
      hasSeenTour?: boolean
      tourCompletedAt?: Date | null
      preferences?: object
    } = {}

    for (const key of Object.keys(body)) {
      if (!ALLOWED_UPDATE_KEYS.has(key)) {
        const err = new Error(`Unknown field: ${key}`) as ApiError
        err.statusCode = 400
        throw err
      }
    }

    if (typeof body['name'] === 'string') {
      const trimmed = body['name'].trim()
      if (trimmed.length < 2 || trimmed.length > 100) {
        const err = new Error('Name must be 2–100 characters') as ApiError
        err.statusCode = 400
        throw err
      }
      updates.name = trimmed
    }

    if (typeof body['hasSeenTour'] === 'boolean') {
      updates.hasSeenTour = body['hasSeenTour']
      updates.tourCompletedAt = body['hasSeenTour'] ? new Date() : null
    }

    if (body['preferences'] !== undefined) {
      if (typeof body['preferences'] !== 'object' || Array.isArray(body['preferences'])) {
        const err = new Error('preferences must be an object') as ApiError
        err.statusCode = 400
        throw err
      }
      updates.preferences = body['preferences'] as object
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updates as never,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clinicId: true,
        hasSeenTour: true,
        tourCompletedAt: true,
        preferences: true,
        customRoleId: true,
        customRole: { select: { id: true, name: true, permissions: true } },
        permissions: true,
      },
    })

    successResponse(res, 200, 'User updated', { user: updated })
  }
)

export const setPassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { token, password, confirmPassword } = req.body

    if (!password || password !== confirmPassword) {
      const err = new Error('Passwords do not match') as ApiError
      err.statusCode = 400
      throw err
    }

    const { userId, email } = await passwordSetupService.redeemPasswordSetupToken(token, password)

    successResponse(res, 200, 'Password set successfully. You can now log in.', {
      userId,
      email,
    })
  }
)
