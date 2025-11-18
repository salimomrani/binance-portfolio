// T165: Watchlist controller
// Handles HTTP concerns for watchlist operations
// Refactored to functional pattern with handler factories

import { Request, Response, NextFunction } from 'express';
import type { WatchlistService } from './watchlist.service';
import { logger } from '../../shared/services/logger.service';

/**
 * Watchlist Handlers Type
 */
export type WatchlistHandlers = {
  getWatchlist: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  addToWatchlist: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  removeFromWatchlist: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  checkInWatchlist: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};

/**
 * Create GET /api/watchlist handler
 */
export const createGetWatchlistHandler = (service: WatchlistService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Get userId from auth middleware (for now use mock)
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      logger.info(`Fetching watchlist for user ${userId}`);

      const watchlist = await service.getWatchlist(userId);

      res.status(200).json({
        success: true,
        data: watchlist,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error fetching watchlist:', error);
      next(error);
    }
  };
};

/**
 * Create POST /api/watchlist handler
 */
export const createAddToWatchlistHandler = (service: WatchlistService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Get userId from auth middleware
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      logger.info(`Adding ${req.body.symbol} to watchlist for user ${userId}`);

      const item = await service.addToWatchlist(userId, req.body);

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
  };
};

/**
 * Create DELETE /api/watchlist/:id handler
 */
export const createRemoveFromWatchlistHandler = (service: WatchlistService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      // TODO: Get userId from auth middleware
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      logger.info(`Removing watchlist item ${id} for user ${userId}`);

      await service.removeFromWatchlist(userId, id);

      res.status(204).send();
    } catch (error) {
      logger.error(`Error removing watchlist item ${req.params.id}:`, error);
      next(error);
    }
  };
};

/**
 * Create GET /api/watchlist/check/:symbol handler
 */
export const createCheckInWatchlistHandler = (service: WatchlistService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { symbol } = req.params;
      // TODO: Get userId from auth middleware
      const userId = (req.headers['x-user-id'] as string) || 'mock-user-id';

      logger.info(`Checking if ${symbol} is in watchlist for user ${userId}`);

      const inWatchlist = await service.isInWatchlist(userId, symbol);

      res.status(200).json({
        success: true,
        data: { inWatchlist, symbol: symbol.toUpperCase() },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error checking watchlist for ${req.params.symbol}:`, error);
      next(error);
    }
  };
};

/**
 * Create all watchlist handlers
 */
export const createWatchlistHandlers = (service: WatchlistService): WatchlistHandlers => ({
  getWatchlist: createGetWatchlistHandler(service),
  addToWatchlist: createAddToWatchlistHandler(service),
  removeFromWatchlist: createRemoveFromWatchlistHandler(service),
  checkInWatchlist: createCheckInWatchlistHandler(service),
});
