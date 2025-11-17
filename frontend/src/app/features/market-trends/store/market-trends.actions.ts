// T138: Market trends actions

import { createAction, props } from '@ngrx/store';
import { PriceHistory, Timeframe } from '../services/market-data-api.service';

// Load historical prices
export const loadHistoricalPrices = createAction(
  '[Market Trends] Load Historical Prices',
  props<{ symbol: string; timeframe: Timeframe }>()
);

export const loadHistoricalPricesSuccess = createAction(
  '[Market Trends] Load Historical Prices Success',
  props<{ symbol: string; timeframe: Timeframe; data: PriceHistory[] }>()
);

export const loadHistoricalPricesFailure = createAction(
  '[Market Trends] Load Historical Prices Failure',
  props<{ error: string }>()
);

// Set selected timeframe
export const setSelectedTimeframe = createAction(
  '[Market Trends] Set Selected Timeframe',
  props<{ timeframe: Timeframe }>()
);

// Clear error
export const clearError = createAction('[Market Trends] Clear Error');
