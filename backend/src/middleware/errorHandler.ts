import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Error Occurred]:', err);

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Validation failed', 422, formattedErrors);
    return;
  }

  // PostgreSQL specific errors
  if (err.code === '23505') {
    // Unique violation
    sendError(res, 'A record with this unique information already exists.', 409, {
      detail: err.detail,
    });
    return;
  }

  if (err.code === '23503') {
    // Foreign key violation
    sendError(res, 'Related resource does not exist or cannot be modified.', 400, {
      detail: err.detail,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  sendError(res, message, statusCode);
}
