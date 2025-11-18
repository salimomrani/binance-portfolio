// T169: Watchlist selectors

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WatchlistState } from './watchlist.state';

export const selectWatchlistState =
  createFeatureSelector<WatchlistState>('watchlist');

export const selectAllWatchlistItems = createSelector(
  selectWatchlistState,
  (state) => state.items
);

export const selectWatchlistLoading = createSelector(
  selectWatchlistState,
  (state) => state.loading
);

export const selectWatchlistError = createSelector(
  selectWatchlistState,
  (state) => state.error
);

export const selectWatchlistLastUpdated = createSelector(
  selectWatchlistState,
  (state) => state.lastUpdated
);

export const selectWatchlistCount = createSelector(
  selectAllWatchlistItems,
  (items) => items.length
);

export const selectWatchlistItemBySymbol = (symbol: string) =>
  createSelector(selectAllWatchlistItems, (items) =>
    items.find((item) => item.symbol === symbol.toUpperCase())
  );

export const selectIsInWatchlist = (symbol: string) =>
  createSelector(
    selectAllWatchlistItems,
    (items) =>
      items.some((item) => item.symbol === symbol.toUpperCase())
  );

// Select gainers (positive 24h change)
export const selectWatchlistGainers = createSelector(
  selectAllWatchlistItems,
  (items) =>
    items
      .filter((item) => item.change24h > 0)
      .sort((a, b) => b.change24h - a.change24h)
);

// Select losers (negative 24h change)
export const selectWatchlistLosers = createSelector(
  selectAllWatchlistItems,
  (items) =>
    items
      .filter((item) => item.change24h < 0)
      .sort((a, b) => a.change24h - b.change24h)
);
