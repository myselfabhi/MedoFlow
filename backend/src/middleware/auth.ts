import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/tokenUtils'
import prisma from '../config/prisma'
import { Role } from '@prisma/client'
import { ApiError } from '../types/errors'
import { hasPermission } from '../config/permissions'

export const protect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('Access token required') as ApiError
      err.statusCode = 401
      throw err
    }

    const token = authHeader.split(' ')[1]!
    const decoded = verifyAccessToken(token)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clinicId: true,
        isActive: true,
        customRoleId: true,
        hasSeenPatientTour: true,
        customRole: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    })

    if (!user) {
      const err = new Error('User not found') as ApiError
      err.statusCode = 401
      throw err
    }

    if (!user.isActive) {
      const err = new Error('Account is deactivated') as ApiError
      err.statusCode = 403
      throw err
    }

    // Resolve effective permissions
    let effectivePermissions: string[] = []
    if (user.role === 'PLATFORM_ADMIN' || user.role === 'SUPER_ADMIN') {
      effectivePermissions = ['*'] // full access
    } else if (user.customRole?.permissions) {
      effectivePermissions = user.customRole.permissions as string[]
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      clinicId: user.clinicId,
      customRoleId: user.customRoleId,
      customRoleName: user.customRole?.name ?? null,
      permissions: effectivePermissions,
      hasSeenPatientTour: user.hasSeenPatientTour,
    }
    req.clinicId = user.clinicId
    next()
  } catch (err) {
    const error = err as ApiError
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error.statusCode = 401
      error.message =
        error.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token'
    }
    next(err)
  }
}

/**
 * System-level role check (enum-based).
 * SUPER_ADMIN always passes. Other roles must be in the allowlist.
 */
export const authorize = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      const err = new Error('Authentication required') as ApiError
      err.statusCode = 401
      next(err)
      return
    }

    // PLATFORM_ADMIN and SUPER_ADMIN always pass any role check
    if (req.user.role === 'PLATFORM_ADMIN' || req.user.role === 'SUPER_ADMIN') {
      next()
      return
    }

    if (!roles.includes(req.user.role)) {
      const err = new Error('Insufficient permissions') as ApiError
      err.statusCode = 403
      next(err)
      return
    }

    next()
  }
}

/**
 * Granular permission check — works with custom roles.
 * SUPER_ADMIN bypasses all checks.
 * Staff users are checked against their custom role permissions.
 */
export const requirePermission = (...requiredKeys: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      const err = new Error('Authentication required') as ApiError
      err.statusCode = 401
      next(err)
      return
    }

    // PLATFORM_ADMIN and SUPER_ADMIN always have full access
    if (req.user.role === 'PLATFORM_ADMIN' || req.user.role === 'SUPER_ADMIN') {
      next()
      return
    }

    const userPerms = req.user.permissions ?? []
    const hasAll = requiredKeys.every((key) => hasPermission(userPerms, key))

    if (!hasAll) {
      const err = new Error('You do not have permission to perform this action') as ApiError
      err.statusCode = 403
      next(err)
      return
    }

    next()
  }
}

export const optionalProtect = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next()
      return
    }

    const token = authHeader.split(' ')[1]!
    const decoded = verifyAccessToken(token)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clinicId: true,
        isActive: true,
        customRoleId: true,
        hasSeenPatientTour: true,
        customRole: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    })

    if (user && user.isActive) {
      let effectivePermissions: string[] = []
      if (user.role === 'PLATFORM_ADMIN' || user.role === 'SUPER_ADMIN') {
        effectivePermissions = ['*']
      } else if (user.customRole?.permissions) {
        effectivePermissions = user.customRole.permissions as string[]
      }

      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as Role,
        clinicId: user.clinicId,
        customRoleId: user.customRoleId,
        customRoleName: user.customRole?.name ?? null,
        permissions: effectivePermissions,
        hasSeenPatientTour: user.hasSeenPatientTour,
      }
      req.clinicId = user.clinicId
    }
    next()
  } catch {
    next()
  }
}
