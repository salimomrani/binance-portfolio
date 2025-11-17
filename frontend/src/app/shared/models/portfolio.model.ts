// T071: Portfolio models

export interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  holdingsCount: number;
  lastUpdated: Date;
  createdAt: Date;
  holdings?: Holding[];
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercentage: number;
  allocationPercentage: number;
  priceChange24h: number;
  notes: string | null;
  lastUpdated: Date;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
  isDefault?: boolean;
}

export interface AddHoldingRequest {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  notes?: string;
}

export interface UpdateHoldingRequest {
  quantity?: number;
  averageCost?: number;
  notes?: string;
}

export interface PortfolioStatistics {
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  bestPerformer: {
    symbol: string;
    gainLossPercentage: number;
  } | null;
  worstPerformer: {
    symbol: string;
    gainLossPercentage: number;
  } | null;
  largestHolding: {
    symbol: string;
    percentage: number;
  } | null;
}
