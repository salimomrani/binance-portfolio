// T066: Holdings controller
// T096: Added transaction endpoints

import { Request, Response, NextFunction, RequestHandler } from 'express';
import type { HoldingsService } from './holdings.service';
import type { TransactionService } from './transaction.service';

/**
 * Holdings Handlers Type
 */
export type HoldingsHandlers = {
  getHoldings: RequestHandler;
  addHolding: RequestHandler;
  getHoldingById: RequestHandler;
  updateHolding: RequestHandler;
  deleteHolding: RequestHandler;
  getTransactions: RequestHandler;
  addTransaction: RequestHandler;
};

/**
 * GET /api/portfolios/:portfolioId/holdings - Get portfolio holdings
 */
export const createGetHoldingsHandler = (service: HoldingsService): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { portfolioId } = req.params;
      const sortBy = req.query.sortBy as 'symbol' | 'value' | 'gainLoss' | undefined;
      const order = (req.query.order as 'asc' | 'desc') || 'asc';

      const holdings = await service.getHoldings(portfolioId, sortBy, order);

      res.json({
        success: true,
        data: holdings,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  };
};

/**
 * POST /api/portfolios/:portfolioId/holdings - Add holding
 */
export const createAddHoldingHandler = (service: HoldingsService): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { portfolioId } = req.params;

      const holding = await service.addHolding(portfolioId, req.body);

      res.status(201).json({
        success: true,
        data: holding,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  };
};

/**
 * GET /api/portfolios/:portfolioId/holdings/:id - Get holding details
 */
export const createGetHoldingByIdHandler = (service: HoldingsService): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const holding = await service.getHoldingById(id);

      res.json({
        success: true,
        data: holding,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  };
};

/**
 * PATCH /api/portfolios/:portfolioId/holdings/:id - Update holding
 */
export const createUpdateHoldingHandler = (service: HoldingsService): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const holding = await service.updateHolding(id, req.body);

      res.json({
        success: true,
        data: holding,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  };
};

/**
 * DELETE /api/portfolios/:portfolioId/holdings/:id - Delete holding
 */
export const createDeleteHoldingHandler = (service: HoldingsService): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      await service.deleteHolding(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * T096: GET /api/portfolios/:portfolioId/holdings/:id/transactions - Get transactions for a holding
 */
export const createGetTransactionsHandler = (transactionService: TransactionService): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: holdingId } = req.params;

      // Parse query parameters
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const sortBy = (req.query.sortBy as 'date' | 'quantity' | 'totalCost' | 'type') || 'date';
      const order = (req.query.order as 'asc' | 'desc') || 'desc';

      const result = await transactionService.getTransactions(holdingId, {
        page,
        limit,
        sortBy,
        order,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  };
};

/**
 * T096: POST /api/portfolios/:portfolioId/holdings/:id/transactions - Add a new transaction
 */
export const createAddTransactionHandler = (transactionService: TransactionService): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: holdingId } = req.params;

      const transaction = await transactionService.addTransaction(holdingId, req.body);

      res.status(201).json({
        success: true,
        data: transaction,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  };
};
