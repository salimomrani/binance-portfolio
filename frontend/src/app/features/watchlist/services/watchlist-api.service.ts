// T170: Watchlist API service

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  WatchlistItem,
  AddToWatchlistRequest,
  WatchlistCheckResponse,
} from '../../../shared/models/watchlist.model';

@Injectable({
  providedIn: 'root',
})
export class WatchlistApiService {
  private readonly api = inject(ApiService);

  /**
   * Get user's watchlist with current prices
   */
  getWatchlist(): Observable<WatchlistItem[]> {
    return this.api.get<WatchlistItem[]>('/watchlist');
  }

  /**
   * Add a cryptocurrency to watchlist
   */
  addToWatchlist(request: AddToWatchlistRequest): Observable<WatchlistItem> {
    return this.api.post<WatchlistItem>('/watchlist', request);
  }

  /**
   * Remove a cryptocurrency from watchlist
   */
  removeFromWatchlist(itemId: string): Observable<void> {
    return this.api.delete<void>(`/watchlist/${itemId}`);
  }

  /**
   * Check if a symbol is in watchlist
   */
  checkInWatchlist(symbol: string): Observable<WatchlistCheckResponse> {
    return this.api.get<WatchlistCheckResponse>(`/watchlist/check/${symbol}`);
  }
}
