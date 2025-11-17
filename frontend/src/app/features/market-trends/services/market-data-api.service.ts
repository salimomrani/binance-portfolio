// T139: Market data API service

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface PriceHistory {
  timestamp: Date;
  price: number;
  volume: number;
}

export type Timeframe = '1h' | '24h' | '7d' | '30d' | '1y';

@Injectable({
  providedIn: 'root',
})
export class MarketDataApiService {
  private readonly api = inject(ApiService);

  getHistoricalPrices(symbol: string, timeframe: Timeframe): Observable<PriceHistory[]> {
    return this.api.get<PriceHistory[]>(`/market/history/${symbol}`, {
      params: { timeframe },
    });
  }

  getAdapterStatus(): Observable<{
    primary: boolean;
    fallback: boolean;
    activeFallback: boolean;
  }> {
    return this.api.get('/market/status');
  }
}
