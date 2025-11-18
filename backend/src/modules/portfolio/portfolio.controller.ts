// T065: Portfolio controller
// Refactored to functional pattern with handler factories

import { Request, Response, NextFunction } from 'express';
import type { PortfolioService } from './portfolio.service';
import type { BinanceSyncService } from './binance-sync.service';
import { logger } from '../../shared/services/logger.service';

/**
 * Portfolio Handlers Type
 */
export type PortfolioHandlers = {
  getPortfolios: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  createPortfolio: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getPortfolioById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updatePortfolio: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deletePortfolio: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getPortfolioStatistics: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getPortfolioAllocation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  syncFromBinance: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};

/**
 * Create GET /api/portfolios handler
 */
export const createGetPortfoliosHandler = (service: PortfolioService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Get userId from auth middleware (for now use mock)
      const userId = req.headers['x-user-id'] as string || 'mock-user-id';

      logger.info(`Fetching portfolios for user ${userId}`);

      const portfolios = await service.getPortfolios(userId);

      res.status(200).json({
        success: true,
        data: portfolios,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error fetching portfolios:', error);
      next(error);
    }
  };
};

/**
 * Create POST /api/portfolios handler
 */
export const createCreatePortfolioHandler = (service: PortfolioService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Get userId from auth middleware
      const userId = req.headers['x-user-id'] as string || 'mock-user-id';

      logger.info(`Creating portfolio for user ${userId}`);

      const portfolio = await service.createPortfolio(userId, req.body);

      res.status(201).json({
        success: true,
        data: portfolio,
        message: 'Portfolio created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error creating portfolio:', error);
      next(error);
    }
  };
};

/**
 * Create GET /api/portfolios/:id handler
 */
export const createGetPortfolioByIdHandler = (service: PortfolioService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      logger.info(`Fetching portfolio ${id}`);

      const portfolio = await service.getPortfolioById(id);

      res.status(200).json({
        success: true,
        data: portfolio,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error fetching portfolio ${req.params.id}:`, error);
      next(error);
    }
  };
};

/**
 * Create PATCH /api/portfolios/:id handler
 */
export const createUpdatePortfolioHandler = (service: PortfolioService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      logger.info(`Updating portfolio ${id}`);

      const portfolio = await service.updatePortfolio(id, req.body);

      res.status(200).json({
        success: true,
        data: portfolio,
        message: 'Portfolio updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error updating portfolio ${req.params.id}:`, error);
      next(error);
    }
  };
};

/**
 * Create DELETE /api/portfolios/:id handler
 */
export const createDeletePortfolioHandler = (service: PortfolioService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      logger.info(`Deleting portfolio ${id}`);

      await service.deletePortfolio(id);

      res.status(204).send();
    } catch (error) {
      logger.error(`Error deleting portfolio ${req.params.id}:`, error);
      next(error);
    }
  };
};

/**
 * Create GET /api/portfolios/:id/statistics handler
 */
export const createGetPortfolioStatisticsHandler = (service: PortfolioService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      logger.info(`Fetching statistics for portfolio ${id}`);

      const statistics = await service.calculatePortfolioStatistics(id);

      res.status(200).json({
        success: true,
        data: statistics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error fetching portfolio statistics ${req.params.id}:`, error);
      next(error);
    }
  };
};

/**
 * Create GET /api/portfolios/:id/allocation handler
 * T123: Returns AllocationData[] with symbol, name, value, percentage, color
 */
export const createGetPortfolioAllocationHandler = (service: PortfolioService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      logger.info(`Fetching allocation for portfolio ${id}`);

      const allocation = await service.getPortfolioAllocation(id);

      res.status(200).json({
        success: true,
        data: allocation,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error fetching portfolio allocation ${req.params.id}:`, error);
      next(error);
    }
  };
};

/**
 * Create POST /api/portfolios/sync-binance handler
 * Fetches current balances from Binance and creates/updates a portfolio
 */
export const createSyncFromBinanceHandler = (binanceSyncService?: BinanceSyncService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!binanceSyncService) {
        res.status(501).json({
          success: false,
          error: {
            code: 'SERVICE_NOT_AVAILABLE',
            message: 'Binance sync service is not configured',
            details: 'Please configure BINANCE_API_KEY and BINANCE_API_SECRET in your environment variables',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // TODO: Get userId from auth middleware
      const userId = req.headers['x-user-id'] as string || 'mock-user-id';

      logger.info(`Syncing portfolio from Binance for user ${userId}`);

      const result = await binanceSyncService.syncFromBinance(userId);

      res.status(200).json({
        success: true,
        data: result,
        message: `Successfully synced ${result.totalHoldings} holdings from Binance`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error syncing from Binance:', error);
      next(error);
    }
  };
};

/**
 * Create all portfolio handlers
 */
export const createPortfolioHandlers = (
  portfolioService: PortfolioService,
  binanceSyncService?: BinanceSyncService
): PortfolioHandlers => ({
  getPortfolios: createGetPortfoliosHandler(portfolioService),
  createPortfolio: createCreatePortfolioHandler(portfolioService),
  getPortfolioById: createGetPortfolioByIdHandler(portfolioService),
  updatePortfolio: createUpdatePortfolioHandler(portfolioService),
  deletePortfolio: createDeletePortfolioHandler(portfolioService),
  getPortfolioStatistics: createGetPortfolioStatisticsHandler(portfolioService),
  getPortfolioAllocation: createGetPortfolioAllocationHandler(portfolioService),
  syncFromBinance: createSyncFromBinanceHandler(binanceSyncService),
});
