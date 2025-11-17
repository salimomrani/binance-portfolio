// T065: Portfolio controller

import { Request, Response, NextFunction, Router } from 'express';
import { PortfolioService } from './portfolio.service';
import { BinanceSyncService } from './binance-sync.service';
import { CreatePortfolioSchema, UpdatePortfolioSchema } from './portfolio.validation';
import { validate } from '../../shared/middleware/validator';

export class PortfolioController {
  public router: Router;

  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly binanceSyncService?: BinanceSyncService
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // GET /api/portfolios - List user portfolios
    this.router.get('/', this.getPortfolios.bind(this));

    // POST /api/portfolios - Create portfolio
    this.router.post('/', validate(CreatePortfolioSchema), this.createPortfolio.bind(this));

    // POST /api/portfolios/sync-binance - Sync portfolio from Binance
    this.router.post('/sync-binance', this.syncFromBinance.bind(this));

    // GET /api/portfolios/:id - Get portfolio details
    this.router.get('/:id', this.getPortfolioById.bind(this));

    // PATCH /api/portfolios/:id - Update portfolio
    this.router.patch('/:id', validate(UpdatePortfolioSchema), this.updatePortfolio.bind(this));

    // DELETE /api/portfolios/:id - Delete portfolio
    this.router.delete('/:id', this.deletePortfolio.bind(this));

    // GET /api/portfolios/:id/statistics - Get portfolio statistics
    this.router.get('/:id/statistics', this.getPortfolioStatistics.bind(this));

    // GET /api/portfolios/:id/allocation - Get portfolio allocation data
    // T123: Portfolio allocation endpoint for charts
    this.router.get('/:id/allocation', this.getPortfolioAllocation.bind(this));
  }

  /**
   * GET /api/portfolios - Get user's portfolios
   */
  private async getPortfolios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Get userId from auth middleware (for now use mock)
      const userId = req.headers['x-user-id'] as string || 'mock-user-id';

      const portfolios = await this.portfolioService.getPortfolios(userId);

      res.json({
        success: true,
        data: portfolios,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/portfolios - Create new portfolio
   */
  private async createPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Get userId from auth middleware
      const userId = req.headers['x-user-id'] as string || 'mock-user-id';

      const portfolio = await this.portfolioService.createPortfolio(userId, req.body);

      res.status(201).json({
        success: true,
        data: portfolio,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/portfolios/:id - Get portfolio details
   */
  private async getPortfolioById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const portfolio = await this.portfolioService.getPortfolioById(id);

      res.json({
        success: true,
        data: portfolio,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/portfolios/:id - Update portfolio
   */
  private async updatePortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const portfolio = await this.portfolioService.updatePortfolio(id, req.body);

      res.json({
        success: true,
        data: portfolio,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/portfolios/:id - Delete portfolio
   */
  private async deletePortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await this.portfolioService.deletePortfolio(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/portfolios/:id/statistics - Get portfolio statistics
   */
  private async getPortfolioStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const statistics = await this.portfolioService.calculatePortfolioStatistics(id);

      res.json({
        success: true,
        data: statistics,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/portfolios/:id/allocation - Get portfolio allocation data
   * T123: Returns AllocationData[] with symbol, name, value, percentage, color
   */
  private async getPortfolioAllocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const allocation = await this.portfolioService.getPortfolioAllocation(id);

      res.json({
        success: true,
        data: allocation,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/portfolios/sync-binance - Sync portfolio from Binance account
   * Fetches current balances from Binance and creates/updates a portfolio
   */
  private async syncFromBinance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.binanceSyncService) {
        res.status(501).json({
          success: false,
          error: 'Binance sync service is not configured',
          message: 'Please configure BINANCE_API_KEY and BINANCE_API_SECRET in your environment variables',
          timestamp: new Date(),
        });
        return;
      }

      // TODO: Get userId from auth middleware
      const userId = req.headers['x-user-id'] as string || 'mock-user-id';

      const result = await this.binanceSyncService.syncFromBinance(userId);

      res.json({
        success: true,
        data: result,
        message: `Successfully synced ${result.totalHoldings} holdings from Binance`,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }
}
