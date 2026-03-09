import { Request, Response, NextFunction } from 'express';
import * as multer from 'multer';
import { ApiError } from '../types/errors';
import { logError } from '../utils/errorLogger';

export const errorHandler = (
  err: ApiError | multer.MulterError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  const multerErr = err as multer.MulterError;
  if (multerErr.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Audio file too large. Maximum size is 50MB.',
    });
  }
  const statusCode = (err as ApiError).statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const stack =
    process.env.NODE_ENV === 'development' ? err.stack : undefined;

  logError(err, {
    path: req.path,
    method: req.method,
    statusCode,
  });

  const response: Record<string, unknown> = {
    success: false,
    message,
  };
  if (stack) response.stack = stack;

  return res.status(statusCode).json(response);
};
