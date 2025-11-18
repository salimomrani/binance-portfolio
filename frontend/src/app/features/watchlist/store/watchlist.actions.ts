// T169: Watchlist actions

import { createAction, props } from '@ngrx/store';
import {
  WatchlistItem,
  AddToWatchlistRequest,
} from '../../../shared/models/watchlist.model';

// Load watchlist
export const loadWatchlist = createAction('[Watchlist] Load Watchlist');

export const loadWatchlistSuccess = createAction(
  '[Watchlist] Load Watchlist Success',
  props<{ items: WatchlistItem[] }>()
);

export const loadWatchlistFailure = createAction(
  '[Watchlist] Load Watchlist Failure',
  props<{ error: string }>()
);

// Add to watchlist
export const addToWatchlist = createAction(
  '[Watchlist] Add To Watchlist',
  props<{ request: AddToWatchlistRequest }>()
);

export const addToWatchlistSuccess = createAction(
  '[Watchlist] Add To Watchlist Success',
  props<{ item: WatchlistItem }>()
);

export const addToWatchlistFailure = createAction(
  '[Watchlist] Add To Watchlist Failure',
  props<{ error: string }>()
);

// Remove from watchlist
export const removeFromWatchlist = createAction(
  '[Watchlist] Remove From Watchlist',
  props<{ itemId: string }>()
);

export const removeFromWatchlistSuccess = createAction(
  '[Watchlist] Remove From Watchlist Success',
  props<{ itemId: string }>()
);

export const removeFromWatchlistFailure = createAction(
  '[Watchlist] Remove From Watchlist Failure',
  props<{ error: string }>()
);

// Refresh prices
export const refreshWatchlistPrices = createAction(
  '[Watchlist] Refresh Prices'
);

// Clear error
export const clearWatchlistError = createAction('[Watchlist] Clear Error');

// Namespace export for convenience
export const WatchlistActions = {
  loadWatchlist,
  loadWatchlistSuccess,
  loadWatchlistFailure,
  addToWatchlist,
  addToWatchlistSuccess,
  addToWatchlistFailure,
  removeFromWatchlist,
  removeFromWatchlistSuccess,
  removeFromWatchlistFailure,
  refreshWatchlistPrices,
  clearWatchlistError,
};
