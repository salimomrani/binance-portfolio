// T169: Watchlist reducer

import { createReducer, on } from '@ngrx/store';
import { initialWatchlistState } from './watchlist.state';
import * as WatchlistActions from './watchlist.actions';

export const watchlistReducer = createReducer(
  initialWatchlistState,

  // Load watchlist
  on(WatchlistActions.loadWatchlist, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(WatchlistActions.loadWatchlistSuccess, (state, { items }) => ({
    ...state,
    items,
    loading: false,
    lastUpdated: new Date(),
  })),

  on(WatchlistActions.loadWatchlistFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Add to watchlist
  on(WatchlistActions.addToWatchlist, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(WatchlistActions.addToWatchlistSuccess, (state, { item }) => ({
    ...state,
    items: [item, ...state.items],
    loading: false,
  })),

  on(WatchlistActions.addToWatchlistFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Remove from watchlist
  on(WatchlistActions.removeFromWatchlist, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(WatchlistActions.removeFromWatchlistSuccess, (state, { itemId }) => ({
    ...state,
    items: state.items.filter((item) => item.id !== itemId),
    loading: false,
  })),

  on(WatchlistActions.removeFromWatchlistFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Refresh prices
  on(WatchlistActions.refreshWatchlistPrices, (state) => ({
    ...state,
    loading: true,
  })),

  // Clear error
  on(WatchlistActions.clearWatchlistError, (state) => ({
    ...state,
    error: null,
  }))
);
