// T050: Market data types and interfaces

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change1h?: number;
  change24h: number;
  change7d?: number;
  change30d?: number;
  volume24h: number;
  marketCap: number;
  high24h?: number;
  low24h?: number;
  lastUpdated: Date;
}

export interface PriceHistory {
  timestamp: Date;
  price: number;
  volume: number;
}

export type Timeframe = '1h' | '24h' | '7d' | '30d' | '1y';

export interface PriceChartData {
  symbol: string;
  timeframe: Timeframe;
  data: PriceHistory[];
}

/**
 * Market data adapter interface for multiple data sources
 */
export interface MarketDataAdapter {
  /**
   * Get current price for a single symbol
   */
  getCurrentPrice(symbol: string): Promise<CryptoPrice>;

  /**
   * Get current prices for multiple symbols
   */
  getMultiplePrices(symbols: string[]): Promise<Map<string, CryptoPrice>>;

  /**
   * Get historical prices for a symbol
   */
  getHistoricalPrices(symbol: string, timeframe: Timeframe): Promise<PriceHistory[]>;

  /**
   * Check if the adapter is available/healthy
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Configuration for market data adapters
 */
export interface AdapterConfig {
  binanceApiKey?: string;
  binanceSecretKey?: string;
  coingeckoApiKey?: string;
  cacheTTL: number; // Cache time-to-live in seconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
}
