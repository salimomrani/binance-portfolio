// T108: Holdings selectors

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HoldingsState } from './holdings.state';

export const selectHoldingsState = createFeatureSelector<HoldingsState>('holdings');

export const selectAllHoldings = createSelector(
  selectHoldingsState,
  (state) => state.holdings
);

export const selectSelectedHoldingId = createSelector(
  selectHoldingsState,
  (state) => state.selectedHoldingId
);

export const selectSelectedHolding = createSelector(
  selectHoldingsState,
  (state) => state.selectedHolding
);

export const selectTransactions = createSelector(
  selectHoldingsState,
  (state) => state.transactions
);

export const selectHoldingsLoading = createSelector(
  selectHoldingsState,
  (state) => state.loading
);

export const selectHoldingsError = createSelector(
  selectHoldingsState,
  (state) => state.error
);

export const selectLastUpdated = createSelector(
  selectHoldingsState,
  (state) => state.lastUpdated
);

// Get holding by ID
export const selectHoldingById = (holdingId: string) =>
  createSelector(
    selectAllHoldings,
    (holdings) => holdings.find(h => h.id === holdingId)
  );

// Get holdings sorted by value (descending)
export const selectHoldingsSortedByValue = createSelector(
  selectAllHoldings,
  (holdings) => [...holdings].sort((a, b) => b.currentValue - a.currentValue)
);

// Get holdings with gains
export const selectHoldingsWithGains = createSelector(
  selectAllHoldings,
  (holdings) => holdings.filter(h => h.gainLoss > 0)
);

// Get holdings with losses
export const selectHoldingsWithLosses = createSelector(
  selectAllHoldings,
  (holdings) => holdings.filter(h => h.gainLoss < 0)
);

// Get total portfolio value from holdings
export const selectTotalHoldingsValue = createSelector(
  selectAllHoldings,
  (holdings) => holdings.reduce((sum, h) => sum + h.currentValue, 0)
);

// Get total gain/loss from holdings
export const selectTotalGainLoss = createSelector(
  selectAllHoldings,
  (holdings) => holdings.reduce((sum, h) => sum + h.gainLoss, 0)
);

// Get best performer
export const selectBestPerformer = createSelector(
  selectAllHoldings,
  (holdings) => {
    if (holdings.length === 0) return null;
    return holdings.reduce((best, current) =>
      current.gainLossPercentage > best.gainLossPercentage ? current : best
    );
  }
);

// Get worst performer
export const selectWorstPerformer = createSelector(
  selectAllHoldings,
  (holdings) => {
    if (holdings.length === 0) return null;
    return holdings.reduce((worst, current) =>
      current.gainLossPercentage < worst.gainLossPercentage ? current : worst
    );
  }
);

// Get transactions sorted by date (newest first)
export const selectTransactionsSortedByDate = createSelector(
  selectTransactions,
  (transactions) => [...transactions].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
);
