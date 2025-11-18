/**
 * Portfolio Routes
 * Defines Express routes and maps them to handler functions
 * Refactored to use functional handlers
 */

import { Router } from 'express';
import type { PortfolioHandlers } from './portfolio.controller';
import { validate } from '../../shared/middleware/validator';
import { CreatePortfolioSchema, UpdatePortfolioSchema } from './portfolio.validation';

/**
 * Create portfolio routes
 * @param handlers - Portfolio handler functions
 * @returns Express router with all portfolio endpoints
 */
export default function createPortfolioRoutes(handlers: PortfolioHandlers): Router {
  const router = Router();

  // GET /api/portfolios - Get all portfolios for user
  router.get('/', handlers.getPortfolios);

  // POST /api/portfolios - Create new portfolio
  router.post('/', validate(CreatePortfolioSchema), handlers.createPortfolio);

  // POST /api/portfolios/sync-binance - Sync portfolio from Binance
  router.post('/sync-binance', handlers.syncFromBinance);

  // GET /api/portfolios/:id - Get portfolio details
  router.get('/:id', handlers.getPortfolioById);

  // PATCH /api/portfolios/:id - Update portfolio
  router.patch('/:id', validate(UpdatePortfolioSchema), handlers.updatePortfolio);

  // DELETE /api/portfolios/:id - Delete portfolio
  router.delete('/:id', handlers.deletePortfolio);

  // GET /api/portfolios/:id/statistics - Get portfolio statistics
  router.get('/:id/statistics', handlers.getPortfolioStatistics);

  // GET /api/portfolios/:id/allocation - Get portfolio allocation data
  router.get('/:id/allocation', handlers.getPortfolioAllocation);

  return router;
}
