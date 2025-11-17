// T137: Market trends state interface

import { PriceHistory, Timeframe } from '../services/market-data-api.service';

export interface MarketTrendsState {
  historicalPrices: {
    [symbol: string]: {
      [timeframe: string]: PriceHistory[];
    };
  };
  loading: boolean;
  error: string | null;
  selectedTimeframe: Timeframe;
}

export const initialMarketTrendsState: MarketTrendsState = {
  historicalPrices: {},
  loading: false,
  error: null,
  selectedTimeframe: '7d',
};
