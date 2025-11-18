/**
 * Holdings Routes
 * Defines Express routes and maps them to handler functions
 */

import { Router } from 'express';
import type { HoldingsHandlers } from './holdings.controller';
import { validate } from '../../shared/middleware/validator';
import { AddHoldingSchema, UpdateHoldingSchema } from './holdings.validation';
import { AddTransactionSchema } from './transaction.validation';

/**
 * Create holdings routes
 * @param handlers - Holdings handler functions
 * @returns Express router with all holdings endpoints
 */
export default function createHoldingsRoutes(handlers: HoldingsHandlers): Router {
  const router = Router({ mergeParams: true }); // mergeParams to access :portfolioId

  // GET /api/portfolios/:portfolioId/holdings - List holdings
  router.get('/', handlers.getHoldings);

  // POST /api/portfolios/:portfolioId/holdings - Add holding
  router.post('/', validate(AddHoldingSchema), handlers.addHolding);

  // GET /api/portfolios/:portfolioId/holdings/:id - Get holding details
  router.get('/:id', handlers.getHoldingById);

  // PATCH /api/portfolios/:portfolioId/holdings/:id - Update holding
  router.patch('/:id', validate(UpdateHoldingSchema), handlers.updateHolding);

  // DELETE /api/portfolios/:portfolioId/holdings/:id - Delete holding
  router.delete('/:id', handlers.deleteHolding);

  // T096: Transaction endpoints
  // GET /api/portfolios/:portfolioId/holdings/:id/transactions - Get holding transactions
  router.get('/:id/transactions', handlers.getTransactions);

  // POST /api/portfolios/:portfolioId/holdings/:id/transactions - Add transaction
  router.post('/:id/transactions', validate(AddTransactionSchema), handlers.addTransaction);

  return router;
}
