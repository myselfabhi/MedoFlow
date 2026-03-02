import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/errors';

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const stack =
    process.env.NODE_ENV === 'development' ? err.stack : undefined;

  const response: Record<string, unknown> = {
    success: false,
    message,
  };
  if (stack) response.stack = stack;

  return res.status(statusCode).json(response);
};
