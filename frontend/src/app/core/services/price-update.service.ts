// T155: Price Update Service
// Interval-based polling for cryptocurrency prices

import { Injectable, inject, signal } from '@angular/core';
import { interval, Subscription, switchMap, catchError, of, map, distinctUntilChanged } from 'rxjs';
import { MarketDataApiService } from '../../features/market-trends/services/market-data-api.service';
import { CryptoPrice } from '../../shared/models/crypto-market-data.model';

export interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  previousPrice?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PriceUpdateService {
  private readonly marketDataApi = inject(MarketDataApiService);
  private readonly REFRESH_INTERVAL = 60000; // 60 seconds
  private updateSubscription?: Subscription;

  // Signals for reactive state
  private readonly pricesMap = signal<Map<string, PriceUpdate>>(new Map());
  private readonly lastUpdateTime = signal<Date | null>(null);
  private readonly isPolling = signal<boolean>(false);
  private readonly errorMessage = signal<string | null>(null);

  // Public readonly signals
  readonly prices = this.pricesMap.asReadonly();
  readonly lastUpdate = this.lastUpdateTime.asReadonly();
  readonly polling = this.isPolling.asReadonly();
  readonly error = this.errorMessage.asReadonly();

  /**
   * Start polling for price updates
   * @param symbols Array of cryptocurrency symbols to monitor
   */
  startPriceUpdates(symbols: string[]): void {
    if (this.updateSubscription) {
      console.warn('Price updates already running. Stop existing updates first.');
      return;
    }

    if (symbols.length === 0) {
      console.warn('No symbols provided for price updates.');
      return;
    }

    console.log(`Starting price updates for ${symbols.length} symbols:`, symbols);
    this.isPolling.set(true);
    this.errorMessage.set(null);

    // Fetch immediately on start
    this.fetchPrices(symbols);

    // Then poll at regular intervals
    this.updateSubscription = interval(this.REFRESH_INTERVAL)
      .pipe(
        switchMap(() => this.marketDataApi.getMultiplePrices(symbols)),
        map(prices => this.processPrices(prices)),
        distinctUntilChanged(),
        catchError(error => {
          console.error('Price update failed:', error);
          this.errorMessage.set(error.message || 'Failed to fetch prices');
          return of(null); // Continue polling even on error
        })
      )
      .subscribe(prices => {
        if (prices) {
          this.pricesMap.set(prices);
          this.lastUpdateTime.set(new Date());
          console.log(`Price update successful at ${this.lastUpdateTime()}`);
        }
      });
  }

  /**
   * Stop polling for price updates
   */
  stopPriceUpdates(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
      this.updateSubscription = undefined;
      this.isPolling.set(false);
      console.log('Price updates stopped');
    }
  }

  /**
   * Get price for a specific symbol
   */
  getPriceForSymbol(symbol: string): PriceUpdate | undefined {
    return this.pricesMap().get(symbol);
  }

  /**
   * Check if a symbol is being tracked
   */
  isSymbolTracked(symbol: string): boolean {
    return this.pricesMap().has(symbol);
  }

  /**
   * Get all tracked symbols
   */
  getTrackedSymbols(): string[] {
    return Array.from(this.pricesMap().keys());
  }

  /**
   * Manually trigger a price fetch (useful for refresh button)
   */
  async refreshPrices(symbols: string[]): Promise<void> {
    await this.fetchPrices(symbols);
  }

  /**
   * Fetch prices immediately
   */
  private async fetchPrices(symbols: string[]): Promise<void> {
    try {
      const prices = await this.marketDataApi.getMultiplePrices(symbols).toPromise();
      if (prices) {
        const processedPrices = this.processPrices(prices);
        this.pricesMap.set(processedPrices);
        this.lastUpdateTime.set(new Date());
        this.errorMessage.set(null);
      }
    } catch (error: any) {
      console.error('Failed to fetch prices:', error);
      this.errorMessage.set(error.message || 'Failed to fetch prices');
    }
  }

  /**
   * Process prices and detect changes
   */
  private processPrices(prices: CryptoPrice[]): Map<string, PriceUpdate> {
    const newPricesMap = new Map<string, PriceUpdate>();
    const currentPrices = this.pricesMap();

    prices.forEach(cryptoPrice => {
      const previousPrice = currentPrices.get(cryptoPrice.symbol)?.price;

      newPricesMap.set(cryptoPrice.symbol, {
        symbol: cryptoPrice.symbol,
        price: cryptoPrice.price,
        change24h: cryptoPrice.change24h,
        previousPrice,
      });
    });

    return newPricesMap;
  }

  /**
   * Get time since last update in seconds
   */
  getSecondsSinceLastUpdate(): number | null {
    const lastUpdate = this.lastUpdateTime();
    if (!lastUpdate) return null;

    const now = new Date();
    return Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
  }
}
