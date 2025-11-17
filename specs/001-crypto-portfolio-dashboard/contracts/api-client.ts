/**
 * Frontend API Client Types
 * Auto-generated from OpenAPI spec
 *
 * This file provides TypeScript types and interfaces for all API endpoints.
 * Use these types in Angular services for type-safe API communication.
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: Date;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: Date;
}

// ============================================================================
// PORTFOLIO TYPES
// ============================================================================

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
  isDefault?: boolean;
}

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

export interface AllocationData {
  symbol: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PortfolioDetails extends PortfolioSummary {
  holdings: HoldingDetails[];
  allocationChart: AllocationData[];
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

// ============================================================================
// HOLDING TYPES
// ============================================================================

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
  notes: string | null;
  lastUpdated: Date;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL'
}

export interface AddTransactionRequest {
  type: TransactionType;
  quantity: number;
  pricePerUnit: number;
  fee?: number;
  date: Date;
  notes?: string;
}

export interface TransactionHistory {
  id: string;
  type: TransactionType;
  symbol: string;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  fee: number | null;
  date: Date;
  notes: string | null;
}

// ============================================================================
// WATCHLIST TYPES
// ============================================================================

export interface AddToWatchlistRequest {
  symbol: string;
  name: string;
  notes?: string;
}

export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  NEUTRAL = 'neutral'
}

export interface WatchlistItemDetails {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  change1h: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  trend: TrendDirection;
  notes: string | null;
  addedAt: Date;
}

// ============================================================================
// MARKET DATA TYPES
// ============================================================================

export interface CryptoMarketData {
  symbol: string;
  name: string;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  change30d: number;
  volume24h: number;
  marketCap: number;
  high24h: number | null;
  low24h: number | null;
  lastUpdated: Date;
}

export interface PriceHistoryData {
  timestamp: Date;
  price: number;
  volume: number;
}

export enum Timeframe {
  ONE_HOUR = '1h',
  TWENTY_FOUR_HOURS = '24h',
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  ONE_YEAR = '1y'
}

export interface PriceChartData {
  symbol: string;
  timeframe: Timeframe;
  data: PriceHistoryData[];
}

export interface PricesMap {
  [symbol: string]: number;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

export interface ApiEndpoints {
  // Portfolio
  getPortfolios: () => Promise<ApiResponse<PortfolioSummary[]>>;
  createPortfolio: (data: CreatePortfolioRequest) => Promise<ApiResponse<PortfolioSummary>>;
  getPortfolioById: (portfolioId: string) => Promise<ApiResponse<PortfolioDetails>>;
  updatePortfolio: (portfolioId: string, data: UpdatePortfolioRequest) => Promise<ApiResponse<PortfolioSummary>>;
  deletePortfolio: (portfolioId: string) => Promise<void>;
  getPortfolioStatistics: (portfolioId: string) => Promise<ApiResponse<PortfolioStatistics>>;

  // Holdings
  getHoldings: (portfolioId: string, params?: { sortBy?: string; order?: 'asc' | 'desc' }) => Promise<ApiResponse<HoldingDetails[]>>;
  addHolding: (portfolioId: string, data: AddHoldingRequest) => Promise<ApiResponse<HoldingDetails>>;
  getHoldingById: (portfolioId: string, holdingId: string) => Promise<ApiResponse<HoldingDetails>>;
  updateHolding: (portfolioId: string, holdingId: string, data: UpdateHoldingRequest) => Promise<ApiResponse<HoldingDetails>>;
  deleteHolding: (portfolioId: string, holdingId: string) => Promise<void>;

  // Transactions
  getTransactions: (holdingId: string, params?: { page?: number; limit?: number }) => Promise<PaginatedResponse<TransactionHistory>>;
  addTransaction: (holdingId: string, data: AddTransactionRequest) => Promise<ApiResponse<TransactionHistory>>;

  // Watchlist
  getWatchlist: () => Promise<ApiResponse<WatchlistItemDetails[]>>;
  addToWatchlist: (data: AddToWatchlistRequest) => Promise<ApiResponse<WatchlistItemDetails>>;
  removeFromWatchlist: (watchlistItemId: string) => Promise<void>;

  // Market Data
  getCurrentPrices: (symbols: string[]) => Promise<ApiResponse<PricesMap>>;
  getCryptoPrice: (symbol: string) => Promise<ApiResponse<CryptoMarketData>>;
  getPriceHistory: (symbol: string, timeframe: Timeframe) => Promise<ApiResponse<PriceChartData>>;
}

// ============================================================================
// ERROR CODES
// ============================================================================

export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: 'symbol' | 'value' | 'gainLoss' | 'allocation';
  order?: 'asc' | 'desc';
}

export interface TimeframeParams {
  timeframe: Timeframe;
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example usage in Angular service:
 *
 * @Injectable()
 * export class PortfolioApiService {
 *   private baseUrl = environment.apiUrl;
 *
 *   constructor(private http: HttpClient) {}
 *
 *   getPortfolios(): Observable<ApiResponse<PortfolioSummary[]>> {
 *     return this.http.get<ApiResponse<PortfolioSummary[]>>(
 *       `${this.baseUrl}/portfolios`
 *     );
 *   }
 *
 *   createPortfolio(data: CreatePortfolioRequest): Observable<ApiResponse<PortfolioSummary>> {
 *     return this.http.post<ApiResponse<PortfolioSummary>>(
 *       `${this.baseUrl}/portfolios`,
 *       data
 *     );
 *   }
 *
 *   // ... other methods
 * }
 */
