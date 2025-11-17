// Portfolio types and interfaces

export interface PortfolioSummary {
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
}

export interface HoldingDetails {
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
  volume24h: number;
  marketCap: number;
  notes: string | null;
  lastUpdated: Date;
}

export interface PortfolioDetails extends PortfolioSummary {
  holdings: HoldingDetails[];
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

export interface AllocationData {
  symbol: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
}
