// T066: Holdings controller
// T096: Added transaction endpoints
// T029: Refactored to functional pattern with handler factories

import { Request, Response, NextFunction } from 'express';
import type { HoldingsService } from './holdings.service';
import type { TransactionService } from './transaction.service';
import { logger } from '../../shared/services/logger.service';

/**
 * Holdings Handlers Type
 */
export type HoldingsHandlers = {
  getHoldings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  addHolding: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getHoldingById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateHolding: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteHolding: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getTransactions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  addTransaction: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};

/**
 * Create GET /api/portfolios/:portfolioId/holdings handler
 */
export const createGetHoldingsHandler = (service: HoldingsService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { portfolioId } = req.params;
      const sortBy = req.query.sortBy as 'symbol' | 'value' | 'gainLoss' | undefined;
      const order = (req.query.order as 'asc' | 'desc') || 'asc';

      logger.info(`Getting holdings for portfolio ${portfolioId}`);

      const holdings = await service.getHoldings(portfolioId, sortBy, order);

      res.json({
        success: true,
        data: holdings,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error getting holdings:', error);
      next(error);
    }
  };
};

/**
 * Create POST /api/portfolios/:portfolioId/holdings handler
 */
export const createAddHoldingHandler = (service: HoldingsService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { portfolioId } = req.params;

      logger.info(`Adding holding to portfolio ${portfolioId}`);

      const holding = await service.addHolding(portfolioId, req.body);

      res.status(201).json({
        success: true,
        data: holding,
        message: 'Holding added successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error adding holding:', error);
      next(error);
    }
  };
};

/**
 * Create GET /api/portfolios/:portfolioId/holdings/:id handler
 */
export const createGetHoldingByIdHandler = (service: HoldingsService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      logger.info(`Getting holding ${id}`);

      const holding = await service.getHoldingById(id);

      res.json({
        success: true,
        data: holding,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error getting holding ${req.params.id}:`, error);
      next(error);
    }
  };
};

/**
 * Create PATCH /api/portfolios/:portfolioId/holdings/:id handler
 */
export const createUpdateHoldingHandler = (service: HoldingsService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      logger.info(`Updating holding ${id}`);

      const holding = await service.updateHolding(id, req.body);

      res.json({
        success: true,
        data: holding,
        message: 'Holding updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error updating holding ${req.params.id}:`, error);
      next(error);
    }
  };
};

/**
 * Create DELETE /api/portfolios/:portfolioId/holdings/:id handler
 */
export const createDeleteHoldingHandler = (service: HoldingsService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      logger.info(`Deleting holding ${id}`);

      await service.deleteHolding(id);

      res.status(204).send();
    } catch (error) {
      logger.error(`Error deleting holding ${req.params.id}:`, error);
      next(error);
    }
  };
};

/**
 * Create GET /api/portfolios/:portfolioId/holdings/:id/transactions handler
 */
export const createGetTransactionsHandler = (service: TransactionService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: holdingId } = req.params;

      logger.info(`Getting transactions for holding ${holdingId}`);

      // Parse query parameters
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const sortBy = (req.query.sortBy as 'date' | 'quantity' | 'totalCost' | 'type') || 'date';
      const order = (req.query.order as 'asc' | 'desc') || 'desc';

      const result = await service.getTransactions(holdingId, {
        page,
        limit,
        sortBy,
        order,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error getting transactions:', error);
      next(error);
    }
  };
};

/**
 * Create POST /api/portfolios/:portfolioId/holdings/:id/transactions handler
 */
export const createAddTransactionHandler = (service: TransactionService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: holdingId } = req.params;

      logger.info(`Adding transaction to holding ${holdingId}`);

      const transaction = await service.addTransaction(holdingId, req.body);

      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction added successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error adding transaction:', error);
      next(error);
    }
  };
};

/**
 * Create all holdings handlers
 */
export const createHoldingsHandlers = (
  holdingsService: HoldingsService,
  transactionService: TransactionService
): HoldingsHandlers => ({
  getHoldings: createGetHoldingsHandler(holdingsService),
  addHolding: createAddHoldingHandler(holdingsService),
  getHoldingById: createGetHoldingByIdHandler(holdingsService),
  updateHolding: createUpdateHoldingHandler(holdingsService),
  deleteHolding: createDeleteHoldingHandler(holdingsService),
  getTransactions: createGetTransactionsHandler(transactionService),
  addTransaction: createAddTransactionHandler(transactionService),
});
