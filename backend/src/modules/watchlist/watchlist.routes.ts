// T166: Watchlist routes
// Defines Express routes and maps them to controller methods

import { Router } from 'express';
import { WatchlistController } from './watchlist.controller';
import { validate } from '../../shared/middleware/validator';
import { AddToWatchlistSchema } from './watchlist.validation';

/**
 * Create watchlist routes
 * @param controller - Watchlist controller instance
 * @returns Express router with all watchlist endpoints
 */
export function createWatchlistRoutes(controller: WatchlistController): Router {
  const router = Router();

  // GET /api/watchlist - Get user's watchlist with current prices
  router.get('/', (req, res, next) => controller.getWatchlist(req, res, next));

  // POST /api/watchlist - Add cryptocurrency to watchlist
  router.post(
    '/',
    validate(AddToWatchlistSchema),
    (req, res, next) => controller.addToWatchlist(req, res, next)
  );

  // GET /api/watchlist/check/:symbol - Check if symbol is in watchlist
  router.get('/check/:symbol', (req, res, next) =>
    controller.checkInWatchlist(req, res, next)
  );

  // DELETE /api/watchlist/:id - Remove cryptocurrency from watchlist
  router.delete('/:id', (req, res, next) =>
    controller.removeFromWatchlist(req, res, next)
  );

  return router;
}
