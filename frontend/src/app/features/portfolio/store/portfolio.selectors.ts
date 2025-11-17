// T077: Portfolio selectors with memoization

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PortfolioState } from './portfolio.state';

/**
 * Feature selector for portfolio state
 */
export const selectPortfolioState =
  createFeatureSelector<PortfolioState>('portfolio');

/**
 * Select all portfolios
 */
export const selectAllPortfolios = createSelector(
  selectPortfolioState,
  state => state.portfolios
);

/**
 * Select selected portfolio ID
 */
export const selectSelectedPortfolioId = createSelector(
  selectPortfolioState,
  state => state.selectedPortfolioId
);

/**
 * Select selected portfolio
 */
export const selectSelectedPortfolio = createSelector(
  selectPortfolioState,
  state => state.selectedPortfolio
);

/**
 * Select portfolio loading state
 */
export const selectPortfolioLoading = createSelector(
  selectPortfolioState,
  state => state.loading
);

/**
 * Select portfolio error
 */
export const selectPortfolioError = createSelector(
  selectPortfolioState,
  state => state.error
);

/**
 * Select last updated timestamp
 */
export const selectLastUpdated = createSelector(
  selectPortfolioState,
  state => state.lastUpdated
);

/**
 * Select default portfolio
 */
export const selectDefaultPortfolio = createSelector(
  selectAllPortfolios,
  portfolios => portfolios.find(p => p.isDefault) || null
);

/**
 * Select portfolio count
 */
export const selectPortfolioCount = createSelector(
  selectAllPortfolios,
  portfolios => portfolios.length
);

/**
 * Select holdings from selected portfolio
 */
export const selectSelectedPortfolioHoldings = createSelector(
  selectSelectedPortfolio,
  portfolio => portfolio?.holdings || []
);

/**
 * Select total value of selected portfolio
 */
export const selectSelectedPortfolioTotalValue = createSelector(
  selectSelectedPortfolio,
  portfolio => portfolio?.totalValue || 0
);

/**
 * Select total gain/loss of selected portfolio
 */
export const selectSelectedPortfolioGainLoss = createSelector(
  selectSelectedPortfolio,
  portfolio => ({
    amount: portfolio?.totalGainLoss || 0,
    percentage: portfolio?.totalGainLossPercentage || 0,
  })
);

/**
 * Select holdings count from selected portfolio
 */
export const selectSelectedPortfolioHoldingsCount = createSelector(
  selectSelectedPortfolio,
  portfolio => portfolio?.holdingsCount || 0
);

/**
 * Select portfolio by ID
 */
export const selectPortfolioById = (portfolioId: string) =>
  createSelector(selectAllPortfolios, portfolios =>
    portfolios.find(p => p.id === portfolioId)
  );

/**
 * Select whether a portfolio exists
 */
export const selectHasPortfolios = createSelector(
  selectAllPortfolios,
  portfolios => portfolios.length > 0
);

/**
 * Select whether portfolio is loaded
 */
export const selectIsPortfolioLoaded = createSelector(
  selectSelectedPortfolio,
  selectPortfolioLoading,
  (portfolio, loading) => portfolio !== null && !loading
);

/**
 * Select combined portfolio view model
 */
export const selectPortfolioViewModel = createSelector(
  selectSelectedPortfolio,
  selectPortfolioLoading,
  selectPortfolioError,
  selectLastUpdated,
  (portfolio, loading, error, lastUpdated) => ({
    portfolio,
    loading,
    error,
    lastUpdated,
    isEmpty: !portfolio || (portfolio.holdings && portfolio.holdings.length === 0),
  })
);

/**
 * Select sorted holdings (by value descending)
 */
export const selectSortedHoldingsByValue = createSelector(
  selectSelectedPortfolioHoldings,
  holdings =>
    [...holdings].sort((a, b) => b.currentValue - a.currentValue)
);

/**
 * Select holdings with gains
 */
export const selectHoldingsWithGains = createSelector(
  selectSelectedPortfolioHoldings,
  holdings => holdings.filter(h => h.gainLoss > 0)
);

/**
 * Select holdings with losses
 */
export const selectHoldingsWithLosses = createSelector(
  selectSelectedPortfolioHoldings,
  holdings => holdings.filter(h => h.gainLoss < 0)
);

/**
 * Select best performing holding
 */
export const selectBestPerformingHolding = createSelector(
  selectSelectedPortfolioHoldings,
  holdings =>
    holdings.length > 0
      ? holdings.reduce((best, current) =>
          current.gainLossPercentage > best.gainLossPercentage ? current : best
        )
      : null
);

/**
 * Select worst performing holding
 */
export const selectWorstPerformingHolding = createSelector(
  selectSelectedPortfolioHoldings,
  holdings =>
    holdings.length > 0
      ? holdings.reduce((worst, current) =>
          current.gainLossPercentage < worst.gainLossPercentage
            ? current
            : worst
        )
      : null
);
