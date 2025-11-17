// T138: Market trends reducer

import { createReducer, on } from '@ngrx/store';
import { initialMarketTrendsState } from './market-trends.state';
import * as MarketTrendsActions from './market-trends.actions';

export const marketTrendsReducer = createReducer(
  initialMarketTrendsState,

  on(MarketTrendsActions.loadHistoricalPrices, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(MarketTrendsActions.loadHistoricalPricesSuccess, (state, { symbol, timeframe, data }) => ({
    ...state,
    historicalPrices: {
      ...state.historicalPrices,
      [symbol]: {
        ...(state.historicalPrices[symbol] || {}),
        [timeframe]: data,
      },
    },
    loading: false,
  })),

  on(MarketTrendsActions.loadHistoricalPricesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(MarketTrendsActions.setSelectedTimeframe, (state, { timeframe }) => ({
    ...state,
    selectedTimeframe: timeframe,
  })),

  on(MarketTrendsActions.clearError, (state) => ({
    ...state,
    error: null,
  }))
);
