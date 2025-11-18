// T163: Watchlist types

export interface WatchlistItemDetails {
  id: string;
  userId: string;
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
