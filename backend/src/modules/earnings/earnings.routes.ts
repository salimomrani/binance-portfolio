// Earnings routes - API routes for Binance Earn endpoints

import { Router } from 'express';
import { EarningsService } from './earnings.service';
import * as earningsController from './earnings.controller';

/**
 * Create and configure earnings router
 */
export function createEarningsRouter(earningsService: EarningsService): Router {
  const router = Router();

  // POST /api/earnings/sync - Sync earn positions from Binance
  router.post('/sync', earningsController.syncEarnPositions(earningsService));

  // POST /api/earnings/sync-rewards - Sync rewards history from Binance
  router.post('/sync-rewards', earningsController.syncRewardsHistory(earningsService));

  // GET /api/earnings/summary - Get earnings summary
  router.get('/summary', earningsController.getEarningsSummary(earningsService));

  // GET /api/earnings/positions - Get all earn positions
  router.get('/positions', earningsController.getEarnPositions(earningsService));

  // GET /api/earnings/rewards - Get rewards history
  router.get('/rewards', earningsController.getRewardsHistory(earningsService));

  return router;
}
