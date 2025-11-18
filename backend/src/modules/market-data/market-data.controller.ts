// T120: Market data controller with historical data endpoints
// T144-T145: Enhanced with price endpoints for market data
// Refactored: Controller handles only HTTP concerns (req/res), no routing

import { Request, Response, NextFunction } from 'express';
import { MarketDataService } from './market-data.service';
import { Timeframe } from './market-data.types';
import { logger } from '../../shared/services/logger.service';
import { ApiSuccess, ApiError } from '../../shared/types/api-response';
import { z } from 'zod';

// Validation schemas
const TimeframeSchema = z.enum(['1h', '24h', '7d', '30d', '1y']);

const GetHistoryParamsSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
});

const GetHistoryQuerySchema = z.object({
  timeframe: TimeframeSchema,
});

// T144: Symbol validation schema
const GetPriceParamsSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
});

// T145: Batch symbols validation schema
const GetBatchPricesQuerySchema = z.object({
  symbols: z.string()
    .transform(s => s.split(',').map(sym => sym.trim().toUpperCase()))
    .pipe(z.array(z.string().min(1).max(10)).min(1).max(50)),
});

export class MarketDataController {
  constructor(private readonly service: MarketDataService) {}

  /**
   * T144: GET /api/market/prices/:symbol
   * Returns full market data with all trend indicators (1h, 24h, 7d, 30d)
   */
  async getMarketData(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate params
      const paramsResult = GetPriceParamsSchema.safeParse({
        symbol: req.params.symbol?.toUpperCase(),
      });

      if (!paramsResult.success) {
        const error: ApiError = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid symbol parameter',
            details: paramsResult.error.errors,
          },
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(error);
        return;
      }

      const { symbol } = paramsResult.data;

      logger.info(`Fetching full market data for ${symbol}`);

      // Get market data from service
      const marketData = await this.service.getFullMarketData(symbol);

      const response: ApiSuccess<typeof marketData> = {
        success: true,
        data: marketData,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error fetching market data:', error);
      next(error);
    }
  }

  /**
   * T145: GET /api/market/prices?symbols=BTC,ETH,ADA
   * Returns batch prices for multiple symbols
   */
  async getBatchPrices(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate query
      const queryResult = GetBatchPricesQuerySchema.safeParse({
        symbols: req.query.symbols,
      });

      if (!queryResult.success) {
        const error: ApiError = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid or missing symbols parameter. Provide comma-separated symbols (max 50)',
            details: queryResult.error.errors,
          },
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(error);
        return;
      }

      const { symbols } = queryResult.data;

      logger.info(`Fetching batch prices for ${symbols.length} symbols`);

      // Get prices from service
      const prices = await this.service.getMultiplePrices(symbols);

      // Convert Map to object for JSON serialization
      const pricesObject = Object.fromEntries(prices.entries());

      const response: ApiSuccess<typeof pricesObject> = {
        success: true,
        data: pricesObject,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error fetching batch prices:', error);
      next(error);
    }
  }

  /**
   * GET /api/market/history/:symbol?timeframe=1h|24h|7d|30d|1y
   * Returns array of {timestamp, price, volume}
   */
  async getHistoricalPrices(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate params
      const paramsResult = GetHistoryParamsSchema.safeParse({
        symbol: req.params.symbol?.toUpperCase(),
      });

      if (!paramsResult.success) {
        const error: ApiError = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid symbol parameter',
            details: paramsResult.error.errors,
          },
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(error);
        return;
      }

      // Validate query
      const queryResult = GetHistoryQuerySchema.safeParse({
        timeframe: req.query.timeframe,
      });

      if (!queryResult.success) {
        const error: ApiError = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid or missing timeframe parameter. Must be one of: 1h, 24h, 7d, 30d, 1y',
            details: queryResult.error.errors,
          },
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(error);
        return;
      }

      const { symbol } = paramsResult.data;
      const { timeframe } = queryResult.data;

      logger.info(`Fetching historical prices for ${symbol} with timeframe ${timeframe}`);

      // Get historical data from service
      const history = await this.service.getHistoricalPrices(symbol, timeframe as Timeframe);

      const response: ApiSuccess<typeof history> = {
        success: true,
        data: history,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error fetching historical prices:', error);
      next(error);
    }
  }

  /**
   * GET /api/market/status
   * Returns adapter health status
   */
  async getAdapterStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const status = await this.service.getAdapterStatus();

      const response: ApiSuccess<typeof status> = {
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error fetching adapter status:', error);
      next(error);
    }
  }
}
