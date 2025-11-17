// Crypto Market Data Models for frontend

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

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number | null;
  low24h: number | null;
  lastUpdated: Date;
}

export type TrendDirection = 'up' | 'down' | 'neutral';
