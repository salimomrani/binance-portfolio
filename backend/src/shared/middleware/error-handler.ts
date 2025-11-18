import { Request, Response, NextFunction } from 'express';
import { isAppError, AppError } from '../types/error.types';
import { createErrorResponse } from '../types/api-response';
import { loggerService } from '../services/logger.service';
import { env } from '../../config/env.config';

/**
 * Global error handling middleware
 * This should be the last middleware in the stack
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  loggerService.error('Request error', {
    method: req.method,
    path: req.path,
    error: error.message,
    stack: error.stack,
  });

  if (isAppError(error)) {
    const response = createErrorResponse(
      error.code,
      error.message,
      error.details,
      env.node.isDevelopment
    );
    res.status(error.statusCode).json(response);
    return;
  }

  // Handle unexpected errors
  const response = createErrorResponse(
    'INTERNAL_SERVER_ERROR',
    env.node.isDevelopment ? error.message : 'An unexpected error occurred',
    env.node.isDevelopment ? { stack: error.stack } : undefined,
    env.node.isDevelopment
  );

  res.status(500).json(response);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response = createErrorResponse('NOT_FOUND', `Route ${req.method} ${req.path} not found`);
  res.status(404).json(response);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
