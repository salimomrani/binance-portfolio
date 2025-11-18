// Earnings routes - API routes for Binance Earn endpoints

import { Router } from 'express';
import type { EarningsService } from './earnings.service';
import * as earningsController from './earnings.controller';

/**
 * Create and configure earnings router
 */
export function createEarningsRouter(earningsService: EarningsService): Router {
  const router = Router();

  router.post('/sync', earningsController.syncEarnPositions(earningsService));
  router.post('/sync-rewards', earningsController.syncRewardsHistory(earningsService));
  router.get('/summary', earningsController.getEarningsSummary(earningsService));
  router.get('/positions', earningsController.getEarnPositions(earningsService));
  router.get('/rewards', earningsController.getRewardsHistory(earningsService));

  return router;
}

export default createEarningsRouter;
