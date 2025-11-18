// T166: Watchlist routes
// Defines Express routes and maps them to controller handlers
// Refactored to use functional handlers

import { Router } from 'express';
import type { WatchlistHandlers } from './watchlist.controller';
import { validate } from '../../shared/middleware/validator';
import { AddToWatchlistSchema } from './watchlist.validation';

/**
 * Create watchlist routes
 * @param handlers - Watchlist handler functions
 * @returns Express router with all watchlist endpoints
 */
export default function createWatchlistRoutes(handlers: WatchlistHandlers): Router {
  const router = Router();

  // GET /api/watchlist - Get user's watchlist with current prices
  router.get('/', handlers.getWatchlist);

  // POST /api/watchlist - Add cryptocurrency to watchlist
  router.post('/', validate(AddToWatchlistSchema), handlers.addToWatchlist);

  // GET /api/watchlist/check/:symbol - Check if symbol is in watchlist
  router.get('/check/:symbol', handlers.checkInWatchlist);

  // DELETE /api/watchlist/:id - Remove cryptocurrency from watchlist
  router.delete('/:id', handlers.removeFromWatchlist);

  return router;
}
