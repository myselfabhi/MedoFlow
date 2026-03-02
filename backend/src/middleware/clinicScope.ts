import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/errors';

export const assertClinicAccess = (
  req: Request,
  resourceClinicId: string | null
): void => {
  if (!req.user) {
    const err = new Error('Authentication required') as ApiError;
    err.statusCode = 401;
    throw err;
  }

  if (req.user.role === 'SUPER_ADMIN') {
    return;
  }

  if (!resourceClinicId) {
    const err = new Error('Resource does not belong to any clinic') as ApiError;
    err.statusCode = 403;
    throw err;
  }

  if (req.user.clinicId !== resourceClinicId) {
    const err = new Error(
      'Access denied: resource belongs to another clinic'
    ) as ApiError;
    err.statusCode = 403;
    throw err;
  }
};

export const enforceClinicScope = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    const err = new Error('Authentication required') as ApiError;
    err.statusCode = 401;
    next(err);
    return;
  }

  if (req.user.role === 'SUPER_ADMIN') {
    req.clinicId =
      (req.query.clinicId as string) || (req.body?.clinicId as string) || null;
    req.bypassClinicScope = true;
    next();
    return;
  }

  if (!req.user.clinicId) {
    const err = new Error('User is not assigned to a clinic') as ApiError;
    err.statusCode = 403;
    next(err);
    return;
  }

  req.clinicId = req.user.clinicId;
  req.bypassClinicScope = false;
  next();
};

export const getClinicWhere = (
  req: Request
): { clinicId: string } | Record<string, never> => {
  if (
    req.bypassClinicScope &&
    req.user?.role === 'SUPER_ADMIN' &&
    !req.clinicId
  ) {
    return {};
  }
  if (req.clinicId) {
    return { clinicId: req.clinicId };
  }
  return {};
};
