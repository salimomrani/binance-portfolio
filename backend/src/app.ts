import express, { Application, Request, Response } from 'express';
import { env } from './config/env.config';
import { securityMiddleware, corsMiddleware } from './shared/middleware/security';
import { rateLimiter } from './shared/middleware/rate-limiter';
import { errorHandler, notFoundHandler } from './shared/middleware/error-handler';
import { createSuccessResponse } from './shared/types/api-response';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Security middleware
  app.use(securityMiddleware);
  app.use(corsMiddleware);

  // Rate limiting
  app.use(rateLimiter);

  // Health check endpoint (before API prefix)
  app.get('/health', (_req: Request, res: Response) => {
    res.json(
      createSuccessResponse({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.node.env,
      })
    );
  });

  // API routes will be mounted here
  // Example: app.use(`${env.server.apiPrefix}/portfolios`, portfolioRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
