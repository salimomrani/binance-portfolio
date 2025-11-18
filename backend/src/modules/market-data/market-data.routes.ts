/**
 * Market Data Routes
 * Defines Express routes and maps them to controller methods
 */

import { Router } from 'express';
import { MarketDataController } from './market-data.controller';

/**
 * Create market data routes
 * @param controller - Market data controller instance
 * @returns Express router with all market data endpoints
 */
export function createMarketDataRoutes(controller: MarketDataController): Router {
  const router = Router();

  // GET /api/market-data/prices/:symbol - Get full market data for single symbol
  router.get(
    '/prices/:symbol',
    (req, res, next) => controller.getMarketData(req, res, next)
  );

  // GET /api/market-data/prices?symbols=BTC,ETH,ADA - Get prices for multiple symbols
  router.get(
    '/prices',
    (req, res, next) => controller.getBatchPrices(req, res, next)
  );

  // GET /api/market-data/history/:symbol?timeframe=1h|24h|7d|30d|1y - Get historical prices
  router.get(
    '/history/:symbol',
    (req, res, next) => controller.getHistoricalPrices(req, res, next)
  );

  // GET /api/market-data/status - Get adapter health status
  router.get(
    '/status',
    (req, res, next) => controller.getAdapterStatus(req, res, next)
  );

  return router;
}
