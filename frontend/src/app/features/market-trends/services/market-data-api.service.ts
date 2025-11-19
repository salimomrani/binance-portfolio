// T139: Market data API service
// Enhanced for T148: Added crypto market data endpoints

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
    return this.api.get<Array<{timestamp: string; price: number; volume: number}>>(`/market/history/${symbol}`, { timeframe })
      .pipe(
        map(data => data.map(item => ({
          timestamp: new Date(item.timestamp),
          price: item.price,
          volume: item.volume
        })))
      );
  }

  getCryptoMarketData(symbol: string): Observable<CryptoMarketData> {
    return this.api.get<CryptoMarketData>(`/market/prices/${symbol}`);
  }

  getMultiplePrices(symbols: string[]): Observable<CryptoPrice[]> {
    return this.api
      .get<Record<string, CryptoPrice>>('/market/prices', { symbols: symbols.join(',') })
      .pipe(map(pricesMap => Object.values(pricesMap)));
  }

  getAdapterStatus(): Observable<{
    primary: boolean;
    fallback: boolean;
    activeFallback: boolean;
  }> {
    return this.api.get('/market/status');
  }
}
