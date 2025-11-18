// T169: Watchlist state interface

import { WatchlistItem } from '../../../shared/models/watchlist.model';

export interface WatchlistState {
  items: WatchlistItem[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const initialWatchlistState: WatchlistState = {
  items: [],
  loading: false,
  error: null,
  lastUpdated: null,
};
