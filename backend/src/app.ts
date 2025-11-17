import express, { Application, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { env } from './config/env.config';
import { securityMiddleware, corsMiddleware } from './shared/middleware/security';
import { rateLimiter } from './shared/middleware/rate-limiter';
import { errorHandler, notFoundHandler } from './shared/middleware/error-handler';
import { createSuccessResponse } from './shared/types/api-response';
import { CacheService } from './shared/services/cache.service';
import { CalculationsService } from './shared/services/calculations.service';
import { MarketDataService } from './modules/market-data/market-data.service';
import { PortfolioService } from './modules/portfolio/portfolio.service';
import { PortfolioController } from './modules/portfolio/portfolio.controller';
import { HoldingsService } from './modules/holdings/holdings.service';
import { HoldingsController } from './modules/holdings/holdings.controller';

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

  // Initialize services and controllers (T067-T068)
  const { prisma, cacheService } = initializeServices();
  const portfolioController = initializePortfolioController(prisma, cacheService);
  const holdingsController = initializeHoldingsController(prisma, cacheService);

  // API routes
  app.use('/api/portfolios', portfolioController.router);
  app.use('/api/portfolios/:portfolioId/holdings', holdingsController.router);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Initialize core services
 */
function initializeServices() {
  const prisma = new PrismaClient();
  const cacheService = new CacheService();

  return { prisma, cacheService };
}

/**
 * Initialize portfolio controller with dependencies
 */
function initializePortfolioController(prisma: PrismaClient, cacheService: CacheService) {
  const calculations = new CalculationsService();
  const marketData = new MarketDataService(
    {
      cacheTTL: 60,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    prisma,
    cacheService
  );
  const portfolioService = new PortfolioService(prisma, marketData, calculations);

  return new PortfolioController(portfolioService);
}

/**
 * Initialize holdings controller with dependencies
 */
function initializeHoldingsController(prisma: PrismaClient, cacheService: CacheService) {
  const calculations = new CalculationsService();
  const marketData = new MarketDataService(
    {
      cacheTTL: 60,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    prisma,
    cacheService
  );
  const holdingsService = new HoldingsService(prisma, marketData, calculations);

  return new HoldingsController(holdingsService);
}
