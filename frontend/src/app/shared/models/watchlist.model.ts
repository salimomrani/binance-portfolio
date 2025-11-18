// T168: Watchlist model

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  change1h: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  trend: 'up' | 'down' | 'neutral';
  notes: string | null;
  addedAt: Date;
}

export interface AddToWatchlistRequest {
  symbol: string;
  name: string;
  notes?: string;
}

export interface WatchlistCheckResponse {
  inWatchlist: boolean;
  symbol: string;
}
