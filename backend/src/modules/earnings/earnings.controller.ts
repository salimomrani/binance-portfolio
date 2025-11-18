// Earnings controller - Request handlers for Binance Earn endpoints

import { Request, Response, NextFunction } from 'express';
import { EarningsService } from './earnings.service';

/**
 * POST /api/earnings/sync - Sync earn positions from Binance
 */
export async function syncEarnPositions(
  earningsService: EarningsService
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Get userId from auth middleware
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      const result = await earningsService.syncEarnPositions(userId);

      res.json({
        success: true,
        data: result,
        message: `Successfully synced ${result.totalPositions} earn positions from Binance`,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 * POST /api/earnings/sync-rewards - Sync rewards history from Binance
 */
export async function syncRewardsHistory(
  earningsService: EarningsService
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const rewardsAdded = await earningsService.syncRewardsHistory(
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
  };
}

/**
 * GET /api/earnings/summary - Get earnings summary
 */
export async function getEarningsSummary(
  earningsService: EarningsService
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Get userId from auth middleware
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      const summary = await earningsService.getEarningsSummary(userId);

      res.json({
        success: true,
        data: summary,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 * GET /api/earnings/positions - Get all earn positions
 */
export async function getEarnPositions(
  earningsService: EarningsService
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Get userId from auth middleware
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      const positions = await earningsService.getEarnPositions(userId);

      res.json({
        success: true,
        data: positions,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 * GET /api/earnings/rewards - Get rewards history
 */
export async function getRewardsHistory(
  earningsService: EarningsService
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const rewards = await earningsService.getRewardsHistory(
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
  };
}
