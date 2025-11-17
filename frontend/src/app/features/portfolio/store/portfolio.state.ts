// T073: Portfolio state interface

import { Portfolio } from '../../../shared/models/portfolio.model';

export interface PortfolioState {
  portfolios: Portfolio[];
  selectedPortfolioId: string | null;
  selectedPortfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const initialPortfolioState: PortfolioState = {
  portfolios: [],
  selectedPortfolioId: null,
  selectedPortfolio: null,
  loading: false,
  error: null,
  lastUpdated: null,
};
