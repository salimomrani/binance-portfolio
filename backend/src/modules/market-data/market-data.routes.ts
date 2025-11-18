/**
 * Market Data Routes
 * Defines Express routes and maps them to handler functions
 */

import { Router } from 'express';
import type { MarketDataHandlers } from './market-data.controller';

/**
 * Create market data routes
 * @param handlers - Market data handler functions
 * @returns Express router with all market data endpoints
 */
export default function createMarketDataRoutes(handlers: MarketDataHandlers): Router {
  const router = Router();

  // GET /api/market-data/prices/:symbol - Get full market data for single symbol
  router.get('/prices/:symbol', handlers.getMarketData);

  // GET /api/market-data/prices?symbols=BTC,ETH,ADA - Get prices for multiple symbols
  router.get('/prices', handlers.getBatchPrices);

  // GET /api/market-data/history/:symbol?timeframe=1h|24h|7d|30d|1y - Get historical prices
  router.get('/history/:symbol', handlers.getHistoricalPrices);

  // GET /api/market-data/status - Get adapter health status
  router.get('/status', handlers.getAdapterStatus);

  return router;
}
