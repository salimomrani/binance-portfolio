/**
 * Holdings Routes
 * T031: Holdings route definitions
 */

import { Router } from 'express';
import type { HoldingsHandlers } from './holdings.controller';
import { validate } from '../../shared/middleware/validator';
import { AddHoldingSchema, UpdateHoldingSchema } from './holdings.validation';
import { AddTransactionSchema } from './transaction.validation';

/**
 * Create Holdings Routes
 * Factory function that creates Express router with all holdings endpoints
 */
export default function createHoldingsRoutes(handlers: HoldingsHandlers): Router {
  const router = Router({ mergeParams: true }); // mergeParams to access :portfolioId

  // ============================================================
  // Holdings Endpoints
  // ============================================================

  /**
   * GET /api/portfolios/:portfolioId/holdings
   * List all holdings in a portfolio
   */
  router.get('/', handlers.getHoldings);

  /**
   * POST /api/portfolios/:portfolioId/holdings
   * Add a new holding to a portfolio
   */
  router.post('/', validate(AddHoldingSchema), handlers.addHolding);

  /**
   * GET /api/portfolios/:portfolioId/holdings/:id
   * Get details of a specific holding
   */
  router.get('/:id', handlers.getHoldingById);

  /**
   * PATCH /api/portfolios/:portfolioId/holdings/:id
   * Update a holding
   */
  router.patch('/:id', validate(UpdateHoldingSchema), handlers.updateHolding);

  /**
   * DELETE /api/portfolios/:portfolioId/holdings/:id
   * Delete a holding
   */
  router.delete('/:id', handlers.deleteHolding);

  // ============================================================
  // Transaction Endpoints
  // ============================================================

  /**
   * GET /api/portfolios/:portfolioId/holdings/:id/transactions
   * Get all transactions for a holding (with pagination)
   */
  router.get('/:id/transactions', handlers.getTransactions);

  /**
   * POST /api/portfolios/:portfolioId/holdings/:id/transactions
   * Add a new transaction to a holding
   */
  router.post('/:id/transactions', validate(AddTransactionSchema), handlers.addTransaction);

  return router;
}
