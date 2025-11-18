// T165: Watchlist controller
// Handles HTTP concerns for watchlist operations

import { Request, Response, NextFunction } from 'express';
import { WatchlistService } from './watchlist.service';
import { logger } from '../../shared/services/logger.service';

export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  /**
   * GET /api/watchlist - Get user's watchlist with current prices
   */
  async getWatchlist(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // TODO: Get userId from auth middleware (for now use mock)
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      logger.info(`Fetching watchlist for user ${userId}`);

      const watchlist = await this.watchlistService.getWatchlist(userId);

      res.status(200).json({
        success: true,
        data: watchlist,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error fetching watchlist:', error);
      next(error);
    }
  }

  /**
   * POST /api/watchlist - Add cryptocurrency to watchlist
   */
  async addToWatchlist(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // TODO: Get userId from auth middleware
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      logger.info(`Adding ${req.body.symbol} to watchlist for user ${userId}`);

      const item = await this.watchlistService.addToWatchlist(userId, req.body);

      res.status(201).json({
        success: true,
        data: item,
        message: 'Added to watchlist successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error adding to watchlist:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/watchlist/:id - Remove cryptocurrency from watchlist
   */
  async removeFromWatchlist(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      // TODO: Get userId from auth middleware
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      logger.info(`Removing watchlist item ${id} for user ${userId}`);

      await this.watchlistService.removeFromWatchlist(userId, id);

      res.status(204).send();
    } catch (error) {
      logger.error(`Error removing watchlist item ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * GET /api/watchlist/check/:symbol - Check if symbol is in watchlist
   */
  async checkInWatchlist(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { symbol } = req.params;
      // TODO: Get userId from auth middleware
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      logger.info(`Checking if ${symbol} is in watchlist for user ${userId}`);

      const inWatchlist = await this.watchlistService.isInWatchlist(
        userId,
        symbol
      );

      res.status(200).json({
        success: true,
        data: { inWatchlist, symbol: symbol.toUpperCase() },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        `Error checking watchlist for ${req.params.symbol}:`,
        error
      );
      next(error);
    }
  }
}
