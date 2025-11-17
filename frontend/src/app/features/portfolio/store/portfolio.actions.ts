// T074: Portfolio actions

import { createAction, props } from '@ngrx/store';
import { Portfolio, CreatePortfolioRequest, UpdatePortfolioRequest } from '../../../shared/models/portfolio.model';

// Load portfolios
export const loadPortfolios = createAction('[Portfolio] Load Portfolios');

export const loadPortfoliosSuccess = createAction(
  '[Portfolio] Load Portfolios Success',
  props<{ portfolios: Portfolio[] }>()
);

export const loadPortfoliosFailure = createAction(
  '[Portfolio] Load Portfolios Failure',
  props<{ error: string }>()
);

// Select portfolio
export const selectPortfolio = createAction(
  '[Portfolio] Select Portfolio',
  props<{ portfolioId: string }>()
);

export const loadPortfolioDetails = createAction(
  '[Portfolio] Load Portfolio Details',
  props<{ portfolioId: string }>()
);

export const loadPortfolioDetailsSuccess = createAction(
  '[Portfolio] Load Portfolio Details Success',
  props<{ portfolio: Portfolio }>()
);

export const loadPortfolioDetailsFailure = createAction(
  '[Portfolio] Load Portfolio Details Failure',
  props<{ error: string }>()
);

// Create portfolio
export const createPortfolio = createAction(
  '[Portfolio] Create Portfolio',
  props<{ request: CreatePortfolioRequest }>()
);

export const createPortfolioSuccess = createAction(
  '[Portfolio] Create Portfolio Success',
  props<{ portfolio: Portfolio }>()
);

export const createPortfolioFailure = createAction(
  '[Portfolio] Create Portfolio Failure',
  props<{ error: string }>()
);

// Update portfolio
export const updatePortfolio = createAction(
  '[Portfolio] Update Portfolio',
  props<{ portfolioId: string; request: UpdatePortfolioRequest }>()
);

export const updatePortfolioSuccess = createAction(
  '[Portfolio] Update Portfolio Success',
  props<{ portfolio: Portfolio }>()
);

export const updatePortfolioFailure = createAction(
  '[Portfolio] Update Portfolio Failure',
  props<{ error: string }>()
);

// Delete portfolio
export const deletePortfolio = createAction(
  '[Portfolio] Delete Portfolio',
  props<{ portfolioId: string }>()
);

export const deletePortfolioSuccess = createAction(
  '[Portfolio] Delete Portfolio Success',
  props<{ portfolioId: string }>()
);

export const deletePortfolioFailure = createAction(
  '[Portfolio] Delete Portfolio Failure',
  props<{ error: string }>()
);

// Update prices
export const updatePrices = createAction(
  '[Portfolio] Update Prices',
  props<{ prices: Map<string, number> }>()
);

// Clear error
export const clearError = createAction('[Portfolio] Clear Error');
