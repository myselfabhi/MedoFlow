import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenUtils';
import prisma from '../config/prisma';
import { Role } from '@prisma/client';
import { ApiError } from '../types/errors';

export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('Access token required') as ApiError;
      err.statusCode = 401;
      throw err;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clinicId: true,
        isActive: true,
      },
    });

    if (!user) {
      const err = new Error('User not found') as ApiError;
      err.statusCode = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Account is deactivated') as ApiError;
      err.statusCode = 403;
      throw err;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      clinicId: user.clinicId,
    };
    next();
  } catch (err) {
    const error = err as ApiError;
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      error.statusCode = 401;
      error.message =
        error.name === 'TokenExpiredError'
          ? 'Access token expired'
          : 'Invalid access token';
    }
    next(err);
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      const err = new Error('Authentication required') as ApiError;
      err.statusCode = 401;
      next(err);
      return;
    }

    if (!roles.includes(req.user.role)) {
      const err = new Error('Insufficient permissions') as ApiError;
      err.statusCode = 403;
      next(err);
      return;
    }

    next();
  };
};

export const optionalProtect = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clinicId: true,
        isActive: true,
      },
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as Role,
        clinicId: user.clinicId,
      };
    }
    next();
  } catch {
    next();
  }
};
