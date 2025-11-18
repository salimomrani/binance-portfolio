// Earnings controller - Request handlers for Binance Earn endpoints

import { Request, Response } from 'express';
import type { EarningsService } from './earnings.service';

/**
 * POST /api/earnings/sync - Sync earn positions from Binance
 */
export const syncEarnPositions =
  (earningsService: EarningsService) =>
  async (req: Request, res: Response): Promise<Response> => {
    // TODO: Get userId from auth middleware
    const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

    const result = await earningsService.syncEarnPositions(userId);

    return res.json({
      success: true,
      data: result,
      message: `Successfully synced ${result.totalPositions} earn positions from Binance`,
      timestamp: new Date(),
    });
  };

/**
 * POST /api/earnings/sync-rewards - Sync rewards history from Binance
 */
export const syncRewardsHistory =
  (earningsService: EarningsService) =>
  async (req: Request, res: Response): Promise<Response> => {
    // TODO: Get userId from auth middleware
    const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

    // Get optional time range from query params
    const startTime = req.query.startTime ? parseInt(req.query.startTime as string) : undefined;
    const endTime = req.query.endTime ? parseInt(req.query.endTime as string) : undefined;

    const rewardsAdded = await earningsService.syncRewardsHistory(userId, startTime, endTime);

    return res.json({
      success: true,
      data: { rewardsAdded },
      message: `Successfully synced ${rewardsAdded} rewards from Binance`,
      timestamp: new Date(),
    });
  };

/**
 * GET /api/earnings/summary - Get earnings summary
 */
export const getEarningsSummary =
  (earningsService: EarningsService) =>
  async (req: Request, res: Response): Promise<Response> => {
    // TODO: Get userId from auth middleware
    const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

    const summary = await earningsService.getEarningsSummary(userId);

    return res.json({
      success: true,
      data: summary,
      timestamp: new Date(),
    });
  };

/**
 * GET /api/earnings/positions - Get all earn positions
 */
export const getEarnPositions =
  (earningsService: EarningsService) =>
  async (req: Request, res: Response): Promise<Response> => {
    // TODO: Get userId from auth middleware
    const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

    const positions = await earningsService.getEarnPositions(userId);

    return res.json({
      success: true,
      data: positions,
      timestamp: new Date(),
    });
  };

/**
 * GET /api/earnings/rewards - Get rewards history
 */
export const getRewardsHistory =
  (earningsService: EarningsService) =>
  async (req: Request, res: Response): Promise<Response> => {
    // TODO: Get userId from auth middleware
    const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

    // Get optional filters from query params
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const asset = req.query.asset as string | undefined;

    const rewards = await earningsService.getRewardsHistory(userId, startDate, endDate, asset);

    return res.json({
      success: true,
      data: rewards,
      timestamp: new Date(),
    });
  };
