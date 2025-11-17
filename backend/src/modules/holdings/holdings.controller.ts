// T066: Holdings controller
// T096: Added transaction endpoints

import { Request, Response, NextFunction, Router } from 'express';
import { HoldingsService } from './holdings.service';
import { AddHoldingSchema, UpdateHoldingSchema } from './holdings.validation';
import { TransactionService } from './transaction.service';
import { AddTransactionSchema, TransactionQuerySchema } from './transaction.validation';
import { validate } from '../../shared/middleware/validator';

export class HoldingsController {
  public router: Router;

  constructor(
    private readonly holdingsService: HoldingsService,
    private readonly transactionService: TransactionService
  ) {
    this.router = Router({ mergeParams: true }); // mergeParams to access :portfolioId
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // GET /api/portfolios/:portfolioId/holdings - List holdings
    this.router.get('/', this.getHoldings.bind(this));

    // POST /api/portfolios/:portfolioId/holdings - Add holding
    this.router.post('/', validate(AddHoldingSchema), this.addHolding.bind(this));

    // GET /api/portfolios/:portfolioId/holdings/:id - Get holding details
    this.router.get('/:id', this.getHoldingById.bind(this));

    // PATCH /api/portfolios/:portfolioId/holdings/:id - Update holding
    this.router.patch('/:id', validate(UpdateHoldingSchema), this.updateHolding.bind(this));

    // DELETE /api/portfolios/:portfolioId/holdings/:id - Delete holding
    this.router.delete('/:id', this.deleteHolding.bind(this));

    // T096: Transaction endpoints
    // GET /api/portfolios/:portfolioId/holdings/:id/transactions - Get holding transactions
    this.router.get('/:id/transactions', this.getTransactions.bind(this));

    // POST /api/portfolios/:portfolioId/holdings/:id/transactions - Add transaction
    this.router.post(
      '/:id/transactions',
      validate(AddTransactionSchema),
      this.addTransaction.bind(this)
    );
  }

  /**
   * GET /api/portfolios/:portfolioId/holdings - Get portfolio holdings
   */
  private async getHoldings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { portfolioId } = req.params;
      const sortBy = req.query.sortBy as 'symbol' | 'value' | 'gainLoss' | undefined;
      const order = (req.query.order as 'asc' | 'desc') || 'asc';

      const holdings = await this.holdingsService.getHoldings(portfolioId, sortBy, order);

      res.json({
        success: true,
        data: holdings,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/portfolios/:portfolioId/holdings - Add holding
   */
  private async addHolding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { portfolioId } = req.params;

      const holding = await this.holdingsService.addHolding(portfolioId, req.body);

      res.status(201).json({
        success: true,
        data: holding,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/portfolios/:portfolioId/holdings/:id - Get holding details
   */
  private async getHoldingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const holding = await this.holdingsService.getHoldingById(id);

      res.json({
        success: true,
        data: holding,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/portfolios/:portfolioId/holdings/:id - Update holding
   */
  private async updateHolding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const holding = await this.holdingsService.updateHolding(id, req.body);

      res.json({
        success: true,
        data: holding,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/portfolios/:portfolioId/holdings/:id - Delete holding
   */
  private async deleteHolding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await this.holdingsService.deleteHolding(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * T096: GET /api/portfolios/:portfolioId/holdings/:id/transactions - Get transactions for a holding
   */
  private async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: holdingId } = req.params;

      // Parse query parameters
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const sortBy = (req.query.sortBy as 'date' | 'quantity' | 'totalCost' | 'type') || 'date';
      const order = (req.query.order as 'asc' | 'desc') || 'desc';

      const result = await this.transactionService.getTransactions(holdingId, {
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
  }

  /**
   * T096: POST /api/portfolios/:portfolioId/holdings/:id/transactions - Add a new transaction
   */
  private async addTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: holdingId } = req.params;

      const transaction = await this.transactionService.addTransaction(holdingId, req.body);

      res.status(201).json({
        success: true,
        data: transaction,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }
}
