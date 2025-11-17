// T120: Market data controller with historical data endpoints

import { Request, Response, NextFunction, Router } from 'express';
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

export class MarketDataController {
  private readonly router: Router;
  private readonly marketDataService: MarketDataService;

  constructor(marketDataService: MarketDataService) {
    this.router = Router();
    this.marketDataService = marketDataService;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // GET /api/market/history/:symbol?timeframe=1h|24h|7d|30d|1y
    this.router.get('/history/:symbol', this.getHistoricalPrices.bind(this));

    // GET /api/market/status - Adapter health status
    this.router.get('/status', this.getAdapterStatus.bind(this));
  }

  /**
   * GET /api/market/history/:symbol?timeframe=1h|24h|7d|30d|1y
   * Returns array of {timestamp, price, volume}
   */
  private async getHistoricalPrices(
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
      const history = await this.marketDataService.getHistoricalPrices(symbol, timeframe as Timeframe);

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
  private async getAdapterStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const status = await this.marketDataService.getAdapterStatus();

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

  public getRouter(): Router {
    return this.router;
  }
}
