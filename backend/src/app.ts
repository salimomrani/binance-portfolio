import express, { Application, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { env } from './config/env.config';
import { securityMiddleware, corsMiddleware } from './shared/middleware/security';
import { rateLimiter } from './shared/middleware/rate-limiter';
import { errorHandler, notFoundHandler } from './shared/middleware/error-handler';
import { createSuccessResponse } from './shared/types/api-response';
import { CacheService } from './shared/services/cache.service';
import { CalculationsService } from './shared/services/calculations.service';
import { createMarketDataService } from './modules/market-data/market-data.service';
import { createMarketDataCache } from './modules/market-data/market-data.cache';
import { createMarketDataHandlers } from './modules/market-data/market-data.controller';
import createMarketDataRoutes from './modules/market-data/market-data.routes';
import { createMarketDataRepository } from './modules/market-data/market-data.repository';
import { createPortfolioService } from './modules/portfolio/portfolio.service';
import { createPortfolioRepository } from './modules/portfolio/portfolio.repository';
import { createPortfolioHandlers } from './modules/portfolio/portfolio.controller';
import createPortfolioRoutes from './modules/portfolio/portfolio.routes';
import { createBinanceSyncService } from './modules/portfolio/binance-sync.service';
import { createHoldingsRepository } from './modules/holdings/holdings.repository';
import { createTransactionRepository } from './modules/holdings/transaction.repository';
import { createHoldingsService } from './modules/holdings/holdings.service';
import { createTransactionService } from './modules/holdings/transaction.service';
import { createHoldingsHandlers } from './modules/holdings/holdings.controller';
import createHoldingsRoutes from './modules/holdings/holdings.routes';
import { createEarningsService } from './modules/earnings/earnings.service';
import createEarningsRouter from './modules/earnings/earnings.routes';
import { createWatchlistRepository } from './modules/watchlist/watchlist.repository';
import { createWatchlistService } from './modules/watchlist/watchlist.service';
import { createWatchlistHandlers } from './modules/watchlist/watchlist.controller';
import createWatchlistRoutes from './modules/watchlist/watchlist.routes';

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

  // Initialize services and controllers (T067-T068, T120, T166, T036)
  const { prisma, cacheService } = initializeServices();
  const marketDataRouter = initializeMarketDataRouter(prisma, cacheService);
  const portfolioRouter = initializePortfolioRouter(prisma, cacheService);
  const holdingsRouter = initializeHoldingsRouter(prisma, cacheService);
  const earningsRouter = initializeEarningsRouter(prisma, cacheService);
  const watchlistRouter = initializeWatchlistRouter(prisma, cacheService);

  // API routes
  app.use('/api/market', marketDataRouter);
  app.use('/api/portfolios', portfolioRouter);
  app.use('/api/portfolios/:portfolioId/holdings', holdingsRouter);
  app.use('/api/earnings', earningsRouter);
  app.use('/api/watchlist', watchlistRouter);

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
 * Initialize market data router with dependencies
 * T120: Market data routes with functional handlers
 */
function initializeMarketDataRouter(prisma: PrismaClient, cacheService: CacheService) {
  const marketDataRepository = createMarketDataRepository(prisma);
  const marketData = createMarketDataService(
    {
      binanceApiKey: env.marketData.binance.apiKey,
      binanceSecretKey: env.marketData.binance.apiSecret,
      cacheTTL: 60,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    marketDataRepository,
    cacheService,
    createMarketDataCache
  );

  const marketDataHandlers = createMarketDataHandlers(marketData);
  return createMarketDataRoutes(marketDataHandlers);
}

/**
 * Initialize portfolio router with functional dependencies
 */
function initializePortfolioRouter(prisma: PrismaClient, cacheService: CacheService) {
  // Create calculation service
  const calculations = new CalculationsService();
  const marketDataRepository = createMarketDataRepository(prisma);
  const marketData = createMarketDataService(
    {
      binanceApiKey: env.marketData.binance.apiKey,
      binanceSecretKey: env.marketData.binance.apiSecret,
      cacheTTL: 60,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    marketDataRepository,
    cacheService,
    createMarketDataCache
  );

  // Create portfolio service
  const portfolioRepo = createPortfolioRepository(prisma);
  const portfolioService = createPortfolioService(portfolioRepo, marketData, calculations);

  // Create Binance sync service
  const binanceAdapter = marketData.getBinanceAdapter();
  const binanceSyncService = createBinanceSyncService(prisma, binanceAdapter, marketData);

  const portfolioHandlers = createPortfolioHandlers(portfolioService, binanceSyncService);
  return createPortfolioRoutes(portfolioHandlers);
}

/**
 * Initialize holdings router with dependencies
 * T036: Refactored to use functional pattern with repositories
 * T096: Added TransactionService initialization
 */
function initializeHoldingsRouter(prisma: PrismaClient, cacheService: CacheService) {
  const calculations = new CalculationsService();

  // Create market data dependencies
  const marketDataRepo = createMarketDataRepository(prisma);
  const marketData = createMarketDataService(
    {
      binanceApiKey: env.marketData.binance.apiKey,
      binanceSecretKey: env.marketData.binance.apiSecret,
      cacheTTL: 60,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    marketDataRepo,
    cacheService,
    createMarketDataCache
  );

  // Create repositories
  const holdingsRepo = createHoldingsRepository(prisma);
  const transactionRepo = createTransactionRepository(prisma);

  // Create services
  const holdingsService = createHoldingsService(holdingsRepo, marketData, calculations);
  const transactionService = createTransactionService(transactionRepo, holdingsRepo);

  // Create handlers
  const holdingsHandlers = createHoldingsHandlers(holdingsService, transactionService);

  // Create and return routes
  return createHoldingsRoutes(holdingsHandlers);
}

/**
 * Initialize earnings router with functional dependencies
 */
function initializeEarningsRouter(prisma: PrismaClient, cacheService: CacheService) {
  // Create market data dependencies
  const marketDataRepo = createMarketDataRepository(prisma);
  const marketDataService = createMarketDataService(
    {
      binanceApiKey: env.marketData.binance.apiKey,
      binanceSecretKey: env.marketData.binance.apiSecret,
      cacheTTL: 60,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    marketDataRepo,
    cacheService,
    createMarketDataCache
  );

  // Create earnings service
  const binanceAdapter = marketDataService.getBinanceAdapter();
  const earningsService = createEarningsService(prisma, binanceAdapter);

  return createEarningsRouter(earningsService);
}

/**
 * Initialize watchlist router with dependencies
 * T166: Watchlist routes registration
 */
function initializeWatchlistRouter(prisma: PrismaClient, cacheService: CacheService) {
  const marketDataRepo = createMarketDataRepository(prisma);
  const marketData = createMarketDataService(
    {
      binanceApiKey: env.marketData.binance.apiKey,
      binanceSecretKey: env.marketData.binance.apiSecret,
      cacheTTL: 60,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    marketDataRepo,
    cacheService,
    createMarketDataCache
  );
  const watchlistRepo = createWatchlistRepository(prisma);
  const watchlistService = createWatchlistService(watchlistRepo, marketData);
  const watchlistHandlers = createWatchlistHandlers(watchlistService);

  return createWatchlistRoutes(watchlistHandlers);
}
