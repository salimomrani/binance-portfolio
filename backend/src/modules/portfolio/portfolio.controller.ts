// T065: Portfolio controller
// Refactored: Controller handles only HTTP concerns (req/res), no routing (Phase 3)

import { Request, Response, NextFunction } from 'express';
import { PortfolioService } from './portfolio.service';
import { BinanceSyncService } from './binance-sync.service';
import { logger } from '../../shared/services/logger.service';

export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly binanceSyncService?: BinanceSyncService
  ) {}

  /**
   * GET /api/portfolios - Get user's portfolios
   */
  async getPortfolios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Get userId from auth middleware (for now use mock)
      const userId = req.headers['x-user-id'] as string || 'mock-user-id';

      logger.info(`Fetching portfolios for user ${userId}`);

      const portfolios = await this.portfolioService.getPortfolios(userId);

      res.status(200).json({
        success: true,
        data: portfolios,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error fetching portfolios:', error);
      next(error);
    }
  }

  /**
   * POST /api/portfolios - Create new portfolio
   */
  async createPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Get userId from auth middleware
      const userId = req.headers['x-user-id'] as string || 'mock-user-id';

      logger.info(`Creating portfolio for user ${userId}`);

      const portfolio = await this.portfolioService.createPortfolio(userId, req.body);

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
  }

  /**
   * GET /api/portfolios/:id - Get portfolio details
   */
  async getPortfolioById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      logger.info(`Fetching portfolio ${id}`);

      const portfolio = await this.portfolioService.getPortfolioById(id);

      res.status(200).json({
        success: true,
        data: portfolio,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error fetching portfolio ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * PATCH /api/portfolios/:id - Update portfolio
   */
  async updatePortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      logger.info(`Updating portfolio ${id}`);

      const portfolio = await this.portfolioService.updatePortfolio(id, req.body);

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
  }

  /**
   * DELETE /api/portfolios/:id - Delete portfolio
   */
  async deletePortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      logger.info(`Deleting portfolio ${id}`);

      await this.portfolioService.deletePortfolio(id);

      res.status(204).send();
    } catch (error) {
      logger.error(`Error deleting portfolio ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * GET /api/portfolios/:id/statistics - Get portfolio statistics
   */
  async getPortfolioStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      logger.info(`Fetching statistics for portfolio ${id}`);

      const statistics = await this.portfolioService.calculatePortfolioStatistics(id);

      res.status(200).json({
        success: true,
        data: statistics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error fetching portfolio statistics ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * GET /api/portfolios/:id/allocation - Get portfolio allocation data
   * T123: Returns AllocationData[] with symbol, name, value, percentage, color
   */
  async getPortfolioAllocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      logger.info(`Fetching allocation for portfolio ${id}`);

      const allocation = await this.portfolioService.getPortfolioAllocation(id);

      res.status(200).json({
        success: true,
        data: allocation,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error fetching portfolio allocation ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * POST /api/portfolios/sync-binance - Sync portfolio from Binance account
   * Fetches current balances from Binance and creates/updates a portfolio
   */
  async syncFromBinance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.binanceSyncService) {
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

      const result = await this.binanceSyncService.syncFromBinance(userId);

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
  }
}
