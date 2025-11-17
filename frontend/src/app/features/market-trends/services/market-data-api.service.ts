// T139: Market data API service
// Enhanced for T148: Added crypto market data endpoints

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CryptoMarketData, CryptoPrice } from '../../../shared/models/crypto-market-data.model';

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
    return this.api.get<PriceHistory[]>(`/market/history/${symbol}`, { timeframe });
  }

  getCryptoMarketData(symbol: string): Observable<CryptoMarketData> {
    return this.api.get<CryptoMarketData>(`/market/prices/${symbol}`);
  }

  getMultiplePrices(symbols: string[]): Observable<CryptoPrice[]> {
    return this.api.get<CryptoPrice[]>('/market/prices', { symbols: symbols.join(',') });
  }

  getAdapterStatus(): Observable<{
    primary: boolean;
    fallback: boolean;
    activeFallback: boolean;
  }> {
    return this.api.get('/market/status');
  }
}
