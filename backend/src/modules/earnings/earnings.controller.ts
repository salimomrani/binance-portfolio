// Earnings controller - Binance Earn API endpoints

import { Request, Response, NextFunction, Router } from 'express';
import { EarningsService } from './earnings.service';

export class EarningsController {
  public router: Router;

  constructor(private readonly earningsService: EarningsService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // POST /api/earnings/sync - Sync earn positions from Binance
    this.router.post('/sync', this.syncEarnPositions.bind(this));

    // POST /api/earnings/sync-rewards - Sync rewards history from Binance
    this.router.post('/sync-rewards', this.syncRewardsHistory.bind(this));

    // GET /api/earnings/summary - Get earnings summary
    this.router.get('/summary', this.getEarningsSummary.bind(this));

    // GET /api/earnings/positions - Get all earn positions
    this.router.get('/positions', this.getEarnPositions.bind(this));

    // GET /api/earnings/rewards - Get rewards history
    this.router.get('/rewards', this.getRewardsHistory.bind(this));
  }

  /**
   * POST /api/earnings/sync - Sync earn positions from Binance
   */
  private async syncEarnPositions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // TODO: Get userId from auth middleware
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      const result = await this.earningsService.syncEarnPositions(userId);

      res.json({
        success: true,
        data: result,
        message: `Successfully synced ${result.totalPositions} earn positions from Binance`,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/earnings/sync-rewards - Sync rewards history from Binance
   */
  private async syncRewardsHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // TODO: Get userId from auth middleware
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      // Get optional time range from query params
      const startTime = req.query.startTime
        ? parseInt(req.query.startTime as string)
        : undefined;
      const endTime = req.query.endTime
        ? parseInt(req.query.endTime as string)
        : undefined;

      const rewardsAdded = await this.earningsService.syncRewardsHistory(
        userId,
        startTime,
        endTime
      );

      res.json({
        success: true,
        data: { rewardsAdded },
        message: `Successfully synced ${rewardsAdded} rewards from Binance`,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/earnings/summary - Get earnings summary
   */
  private async getEarningsSummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // TODO: Get userId from auth middleware
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      const summary = await this.earningsService.getEarningsSummary(userId);

      res.json({
        success: true,
        data: summary,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/earnings/positions - Get all earn positions
   */
  private async getEarnPositions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // TODO: Get userId from auth middleware
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      const positions = await this.earningsService.getEarnPositions(userId);

      res.json({
        success: true,
        data: positions,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/earnings/rewards - Get rewards history
   */
  private async getRewardsHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // TODO: Get userId from auth middleware
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      // Get optional filters from query params
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;
      const asset = req.query.asset as string | undefined;

      const rewards = await this.earningsService.getRewardsHistory(
        userId,
        startDate,
        endDate,
        asset
      );

      res.json({
        success: true,
        data: rewards,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }
}
