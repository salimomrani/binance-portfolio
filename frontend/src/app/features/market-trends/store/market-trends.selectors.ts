// T138: Market trends selectors

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MarketTrendsState } from './market-trends.state';

export const selectMarketTrendsState =
  createFeatureSelector<MarketTrendsState>('marketTrends');

export const selectHistoricalPrices = createSelector(
  selectMarketTrendsState,
  (state) => state.historicalPrices
);

export const selectHistoricalPricesForSymbol = (symbol: string, timeframe: string) =>
  createSelector(selectHistoricalPrices, (prices) => prices[symbol]?.[timeframe] || []);

export const selectLoading = createSelector(
  selectMarketTrendsState,
  (state) => state.loading
);

export const selectError = createSelector(selectMarketTrendsState, (state) => state.error);

export const selectSelectedTimeframe = createSelector(
  selectMarketTrendsState,
  (state) => state.selectedTimeframe
);
