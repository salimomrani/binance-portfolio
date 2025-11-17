// T075: Portfolio reducer

import { createReducer, on } from '@ngrx/store';
import { initialPortfolioState } from './portfolio.state';
import * as PortfolioActions from './portfolio.actions';

export const portfolioReducer = createReducer(
  initialPortfolioState,

  // Load portfolios
  on(PortfolioActions.loadPortfolios, state => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(PortfolioActions.loadPortfoliosSuccess, (state, { portfolios }) => ({
    ...state,
    portfolios,
    loading: false,
    lastUpdated: new Date(),
  })),

  on(PortfolioActions.loadPortfoliosFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Select portfolio
  on(PortfolioActions.selectPortfolio, (state, { portfolioId }) => ({
    ...state,
    selectedPortfolioId: portfolioId,
  })),

  // Load portfolio details
  on(PortfolioActions.loadPortfolioDetails, state => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(PortfolioActions.loadPortfolioDetailsSuccess, (state, { portfolio }) => ({
    ...state,
    selectedPortfolio: portfolio,
    selectedPortfolioId: portfolio.id,
    loading: false,
    lastUpdated: new Date(),
  })),

  on(PortfolioActions.loadPortfolioDetailsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Create portfolio
  on(PortfolioActions.createPortfolio, state => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(PortfolioActions.createPortfolioSuccess, (state, { portfolio }) => ({
    ...state,
    portfolios: [...state.portfolios, portfolio],
    loading: false,
  })),

  on(PortfolioActions.createPortfolioFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Update portfolio
  on(PortfolioActions.updatePortfolio, state => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(PortfolioActions.updatePortfolioSuccess, (state, { portfolio }) => ({
    ...state,
    portfolios: state.portfolios.map(p => (p.id === portfolio.id ? portfolio : p)),
    selectedPortfolio: state.selectedPortfolio?.id === portfolio.id ? portfolio : state.selectedPortfolio,
    loading: false,
  })),

  on(PortfolioActions.updatePortfolioFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Delete portfolio
  on(PortfolioActions.deletePortfolio, state => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(PortfolioActions.deletePortfolioSuccess, (state, { portfolioId }) => ({
    ...state,
    portfolios: state.portfolios.filter(p => p.id !== portfolioId),
    selectedPortfolio: state.selectedPortfolio?.id === portfolioId ? null : state.selectedPortfolio,
    selectedPortfolioId: state.selectedPortfolioId === portfolioId ? null : state.selectedPortfolioId,
    loading: false,
  })),

  on(PortfolioActions.deletePortfolioFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Update prices
  on(PortfolioActions.updatePrices, (state, { prices }) => {
    // Update prices for holdings in selected portfolio
    if (!state.selectedPortfolio || !state.selectedPortfolio.holdings) {
      return state;
    }

    const updatedHoldings = state.selectedPortfolio.holdings.map(holding => {
      const newPrice = prices.get(holding.symbol);
      if (newPrice !== undefined) {
        const currentValue = holding.quantity * newPrice;
        const gainLoss = currentValue - holding.costBasis;
        const gainLossPercentage = holding.costBasis > 0 ? (gainLoss / holding.costBasis) * 100 : 0;

        return {
          ...holding,
          currentPrice: newPrice,
          currentValue,
          gainLoss,
          gainLossPercentage,
          lastUpdated: new Date(),
        };
      }
      return holding;
    });

    return {
      ...state,
      selectedPortfolio: {
        ...state.selectedPortfolio,
        holdings: updatedHoldings,
      },
    };
  }),

  // Clear error
  on(PortfolioActions.clearError, state => ({
    ...state,
    error: null,
  }))
);
