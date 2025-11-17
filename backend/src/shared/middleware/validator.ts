import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../types/error.types';

/**
 * Validate request body against Zod schema
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Request body validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate request query parameters against Zod schema
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Query parameters validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate request parameters against Zod schema
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('URL parameters validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Backwards-compatible validator helper (defaults to body validation)
 */
export function validate<T extends ZodSchema>(schema: T) {
  return validateBody(schema);
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  uuid: z.string().uuid(),
  email: z.string().email(),
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),
};
