import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.config';
import { createErrorResponse } from '../types/api-response';

/**
 * Global rate limiter
 * Default: 100 requests per 15 minutes
 */
export const rateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  message: createErrorResponse(
    'RATE_LIMIT_EXCEEDED',
    'Too many requests from this IP, please try again later'
  ),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(
      createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests from this IP, please try again later'
      )
    );
  },
});

/**
 * Strict rate limiter for sensitive endpoints (auth, etc.)
 * 10 requests per 15 minutes
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: createErrorResponse(
    'RATE_LIMIT_EXCEEDED',
    'Too many attempts, please try again later'
  ),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(
      createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Too many attempts, please try again later'
      )
    );
  },
});
