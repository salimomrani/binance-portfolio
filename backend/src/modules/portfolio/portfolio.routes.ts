/**
 * Portfolio Routes
 * Defines Express routes and maps them to controller methods
 */

import { Router } from 'express';
import { PortfolioController } from './portfolio.controller';
import { validate } from '../../shared/middleware/validator';
import { CreatePortfolioSchema, UpdatePortfolioSchema } from './portfolio.validation';

/**
 * Create portfolio routes
 * @param controller - Portfolio controller instance
 * @returns Express router with all portfolio endpoints
 */
export function createPortfolioRoutes(controller: PortfolioController): Router {
  const router = Router();

  // GET /api/portfolios - Get all portfolios for user
  router.get(
    '/',
    (req, res, next) => controller.getPortfolios(req, res, next)
  );

  // POST /api/portfolios - Create new portfolio
  router.post(
    '/',
    validate(CreatePortfolioSchema),
    (req, res, next) => controller.createPortfolio(req, res, next)
  );

  // POST /api/portfolios/sync-binance - Sync portfolio from Binance
  router.post(
    '/sync-binance',
    (req, res, next) => controller.syncFromBinance(req, res, next)
  );

  // GET /api/portfolios/:id - Get portfolio details
  router.get(
    '/:id',
    (req, res, next) => controller.getPortfolioById(req, res, next)
  );

  // PATCH /api/portfolios/:id - Update portfolio
  router.patch(
    '/:id',
    validate(UpdatePortfolioSchema),
    (req, res, next) => controller.updatePortfolio(req, res, next)
  );

  // DELETE /api/portfolios/:id - Delete portfolio
  router.delete(
    '/:id',
    (req, res, next) => controller.deletePortfolio(req, res, next)
  );

  // GET /api/portfolios/:id/statistics - Get portfolio statistics
  router.get(
    '/:id/statistics',
    (req, res, next) => controller.getPortfolioStatistics(req, res, next)
  );

  // GET /api/portfolios/:id/allocation - Get portfolio allocation data
  router.get(
    '/:id/allocation',
    (req, res, next) => controller.getPortfolioAllocation(req, res, next)
  );

  return router;
}
