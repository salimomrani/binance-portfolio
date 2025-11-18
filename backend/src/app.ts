import express, { Application, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { env } from './config/env.config';
import { securityMiddleware, corsMiddleware } from './shared/middleware/security';
import { rateLimiter } from './shared/middleware/rate-limiter';
import { errorHandler, notFoundHandler } from './shared/middleware/error-handler';
import { createSuccessResponse } from './shared/types/api-response';
import { CacheService } from './shared/services/cache.service';
import { CalculationsService } from './shared/services/calculations.service';

// Market Data Module
import { createMarketDataRepository } from './modules/market-data/market-data.repository';
import { createMarketDataCache } from './modules/market-data/market-data.cache';
import { createMarketDataService } from './modules/market-data/market-data.service';
import {
  createGetMarketDataHandler,
  createGetBatchPricesHandler,
  createGetHistoricalPricesHandler,
  createGetAdapterStatusHandler,
} from './modules/market-data/market-data.controller';
import createMarketDataRoutes from './modules/market-data/market-data.routes';

// Portfolio Module
import { createPortfolioRepository } from './modules/portfolio/portfolio.repository';
import { createPortfolioService } from './modules/portfolio/portfolio.service';
import { createBinanceSyncService } from './modules/portfolio/binance-sync.service';
import {
  createGetPortfoliosHandler,
  createCreatePortfolioHandler,
  createGetPortfolioByIdHandler,
  createUpdatePortfolioHandler,
  createDeletePortfolioHandler,
  createGetPortfolioStatisticsHandler,
  createGetPortfolioAllocationHandler,
  createSyncFromBinanceHandler,
} from './modules/portfolio/portfolio.controller';
import createPortfolioRoutes from './modules/portfolio/portfolio.routes';

// Holdings Module
import { createHoldingsService } from './modules/holdings/holdings.service';
import { createTransactionService } from './modules/holdings/transaction.service';
import {
  createGetHoldingsHandler,
  createAddHoldingHandler,
  createGetHoldingByIdHandler,
  createUpdateHoldingHandler,
  createDeleteHoldingHandler,
  createGetTransactionsHandler,
  createAddTransactionHandler,
} from './modules/holdings/holdings.controller';
import createHoldingsRoutes from './modules/holdings/holdings.routes';

// Earnings Module
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

  // Initialize services and routers
  const { prisma, cacheService } = initializeServices();
  const marketDataRouter = initializeMarketDataRouter(prisma, cacheService);
  const portfolioRouter = initializePortfolioRouter(prisma, cacheService);
  const holdingsRouter = initializeHoldingsRouter(prisma, cacheService);
  const earningsRouter = initializeEarningsRouter(prisma, cacheService);

  // API routes
  app.use('/api/market', marketDataRouter);
  app.use('/api/portfolios', portfolioRouter);
  app.use('/api/portfolios/:portfolioId/holdings', holdingsRouter);
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
 * Initialize market data router with functional dependencies
 */
function initializeMarketDataRouter(prisma: PrismaClient, cacheService: CacheService) {
  // Create repository
  const marketDataRepo = createMarketDataRepository(prisma);

  // Create service
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

  // Create handlers
  const marketDataHandlers = {
    getMarketData: createGetMarketDataHandler(marketDataService),
    getBatchPrices: createGetBatchPricesHandler(marketDataService),
    getHistoricalPrices: createGetHistoricalPricesHandler(marketDataService),
    getAdapterStatus: createGetAdapterStatusHandler(marketDataService),
  };

  return createMarketDataRoutes(marketDataHandlers);
}

/**
 * Initialize portfolio router with functional dependencies
 */
function initializePortfolioRouter(prisma: PrismaClient, cacheService: CacheService) {
  // Create calculation service
  const calculations = new CalculationsService();

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

  // Create portfolio service
  const portfolioRepo = createPortfolioRepository(prisma);
  const portfolioService = createPortfolioService(portfolioRepo, marketDataService, calculations);

  // Create Binance sync service
  const binanceAdapter = marketDataService.getBinanceAdapter();
  const binanceSyncService = createBinanceSyncService(prisma, binanceAdapter, marketDataService);

  // Create handlers
  const portfolioHandlers = {
    getPortfolios: createGetPortfoliosHandler(portfolioService),
    createPortfolio: createCreatePortfolioHandler(portfolioService),
    getPortfolioById: createGetPortfolioByIdHandler(portfolioService),
    updatePortfolio: createUpdatePortfolioHandler(portfolioService),
    deletePortfolio: createDeletePortfolioHandler(portfolioService),
    getPortfolioStatistics: createGetPortfolioStatisticsHandler(portfolioService),
    getPortfolioAllocation: createGetPortfolioAllocationHandler(portfolioService),
    syncFromBinance: createSyncFromBinanceHandler(portfolioService, binanceSyncService),
  };

  return createPortfolioRoutes(portfolioHandlers);
}

/**
 * Initialize holdings router with functional dependencies
 */
function initializeHoldingsRouter(prisma: PrismaClient, cacheService: CacheService) {
  // Create calculation service
  const calculations = new CalculationsService();

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

  // Create holdings and transaction services
  const holdingsService = createHoldingsService(prisma, marketDataService, calculations);
  const transactionService = createTransactionService(prisma);

  // Create handlers
  const holdingsHandlers = {
    getHoldings: createGetHoldingsHandler(holdingsService),
    addHolding: createAddHoldingHandler(holdingsService),
    getHoldingById: createGetHoldingByIdHandler(holdingsService),
    updateHolding: createUpdateHoldingHandler(holdingsService),
    deleteHolding: createDeleteHoldingHandler(holdingsService),
    getTransactions: createGetTransactionsHandler(transactionService),
    addTransaction: createAddTransactionHandler(transactionService),
  };

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
