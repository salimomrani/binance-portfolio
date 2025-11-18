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
import { MarketDataController } from './modules/market-data/market-data.controller';
import { createPortfolioService } from './modules/portfolio/portfolio.service';
import { createPortfolioRepository } from './modules/portfolio/portfolio.repository';
import { PortfolioController } from './modules/portfolio/portfolio.controller';
import { createBinanceSyncService } from './modules/portfolio/binance-sync.service';
import { createHoldingsService } from './modules/holdings/holdings.service';
import { HoldingsController } from './modules/holdings/holdings.controller';
import { createTransactionService } from './modules/holdings/transaction.service';
import { createEarningsService } from './modules/earnings/earnings.service';
import createEarningsRouter from './modules/earnings/earnings.routes';

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

  // Initialize services and controllers (T067-T068, T120)
  const { prisma, cacheService } = initializeServices();
  const marketDataController = initializeMarketDataController(prisma, cacheService);
  const portfolioController = initializePortfolioController(prisma, cacheService);
  const holdingsController = initializeHoldingsController(prisma, cacheService);
  const earningsRouter = initializeEarningsRouter(prisma, cacheService);

  // API routes
  app.use('/api/market', marketDataController.getRouter());
  app.use('/api/portfolios', portfolioController.router);
  app.use('/api/portfolios/:portfolioId/holdings', holdingsController.router);
  app.use('/api/earnings', earningsRouter);

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
 * Initialize market data controller with dependencies
 * T120: Market data controller with historical endpoints
 */
function initializeMarketDataController(prisma: PrismaClient, cacheService: CacheService) {
  const marketData = new MarketDataService(
    {
      binanceApiKey: env.marketData.binance.apiKey,
      binanceSecretKey: env.marketData.binance.apiSecret,
      cacheTTL: 60,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    prisma,
    cacheService
  );

  return new MarketDataController(marketData);
}

/**
 * Initialize portfolio controller with dependencies
 */
function initializePortfolioController(prisma: PrismaClient, cacheService: CacheService) {
  const calculations = new CalculationsService();
  const marketData = new MarketDataService(
    {
      binanceApiKey: env.marketData.binance.apiKey,
      binanceSecretKey: env.marketData.binance.apiSecret,
      cacheTTL: 60,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    prisma,
    cacheService
  );
  const portfolioRepo = createPortfolioRepository(prisma);
  const portfolioService = createPortfolioService(portfolioRepo, marketData, calculations);

  // Initialize Binance sync service
  const binanceAdapter = marketData.getBinanceAdapter();
  const binanceSyncService = createBinanceSyncService(prisma, binanceAdapter, marketData);

  return new PortfolioController(portfolioService, binanceSyncService);
}

/**
 * Initialize holdings controller with dependencies
 * T096: Added TransactionService initialization
 */
function initializeHoldingsController(prisma: PrismaClient, cacheService: CacheService) {
  const calculations = new CalculationsService();
  const marketData = new MarketDataService(
    {
      binanceApiKey: env.marketData.binance.apiKey,
      binanceSecretKey: env.marketData.binance.apiSecret,
      cacheTTL: 60,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    prisma,
    cacheService
  );
  const holdingsService = createHoldingsService(prisma, marketData, calculations);
  const transactionService = createTransactionService(prisma);

  return new HoldingsController(holdingsService, transactionService);
}

/**
 * Initialize earnings router with dependencies
 */
function initializeEarningsRouter(prisma: PrismaClient, cacheService: CacheService) {
  const marketData = new MarketDataService(
    {
      binanceApiKey: env.marketData.binance.apiKey,
      binanceSecretKey: env.marketData.binance.apiSecret,
      cacheTTL: 60,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    prisma,
    cacheService
  );
  const binanceAdapter = marketData.getBinanceAdapter();
  const earningsService = createEarningsService(prisma, binanceAdapter);

  return createEarningsRouter(earningsService);
}
