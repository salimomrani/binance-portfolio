// T148: Crypto Detail Component

import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap, catchError, of } from 'rxjs';
import { MarketDataApiService, Timeframe, PriceHistory } from '../../services/market-data-api.service';
import { CryptoMarketData } from '../../../../shared/models/crypto-market-data.model';
import { TrendIndicatorComponent } from '../../../../shared/components/trend-indicator/trend-indicator.component';
import { LineChartComponent } from '../../../portfolio/components/portfolio-charts/line-chart/line-chart.component';
import { CRYPTO_COLOR_PALETTE } from '../../../../shared/utils/chart-colors.util';

@Component({
  selector: 'app-crypto-detail',
  standalone: true,
  imports: [CommonModule, TrendIndicatorComponent, LineChartComponent],
  templateUrl: './crypto-detail.component.html',
  styleUrls: ['./crypto-detail.component.scss'],
})
export class CryptoDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly marketDataApi = inject(MarketDataApiService);
  private readonly destroy$ = new Subject<void>();

  // State signals
  cryptoData = signal<CryptoMarketData | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  selectedTimeframe = signal<Timeframe>('7d');
  priceHistory = signal<PriceHistory[]>([]);
  chartLoading = signal<boolean>(false);

  // Available timeframes for the chart
  timeframes: Timeframe[] = ['24h', '7d', '30d', '1y'];

  // Chart color palette
  readonly CRYPTO_COLOR_PALETTE = CRYPTO_COLOR_PALETTE;

  // Computed values
  symbol = computed(() => this.cryptoData()?.symbol || '');
  name = computed(() => this.cryptoData()?.name || '');
  price = computed(() => this.cryptoData()?.price || 0);

  priceFormatted = computed(() => {
    const price = this.price();
    return price >= 1
      ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : price.toFixed(8);
  });

  volumeFormatted = computed(() => {
    const volume = this.cryptoData()?.volume24h || 0;
    return this.formatLargeNumber(volume);
  });

  marketCapFormatted = computed(() => {
    const marketCap = this.cryptoData()?.marketCap || 0;
    return this.formatLargeNumber(marketCap);
  });

  priceRange24h = computed(() => {
    const high = this.cryptoData()?.high24h;
    const low = this.cryptoData()?.low24h;
    if (!high || !low) return 'N/A';
    return `$${low.toFixed(2)} - $${high.toFixed(2)}`;
  });

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap(params => {
          const symbol = params['symbol'];
          if (!symbol) {
            this.error.set('No symbol provided');
            this.loading.set(false);
            return of(null);
          }

          this.loading.set(true);
          this.error.set(null);
          return this.marketDataApi.getCryptoMarketData(symbol.toUpperCase()).pipe(
            catchError(err => {
              this.error.set(err.message || 'Failed to load crypto data');
              this.loading.set(false);
              return of(null);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        if (data) {
          this.cryptoData.set(data);
          // Load initial price history for default timeframe
          this.loadPriceHistory(data.symbol, this.selectedTimeframe());
        }
        this.loading.set(false);
      });
  }

  private loadPriceHistory(symbol: string, timeframe: Timeframe): void {
    this.chartLoading.set(true);
    this.marketDataApi.getHistoricalPrices(symbol, timeframe)
      .pipe(
        catchError(err => {
          console.error('Failed to load price history:', err);
          this.chartLoading.set(false);
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(history => {
        this.priceHistory.set(history);
        this.chartLoading.set(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/portfolio']);
  }

  selectTimeframe(timeframe: Timeframe): void {
    this.selectedTimeframe.set(timeframe);
    const currentSymbol = this.symbol();
    if (currentSymbol) {
      this.loadPriceHistory(currentSymbol, timeframe);
    }
  }

  private formatLargeNumber(value: number): string {
    if (value >= 1_000_000_000_000) {
      return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
    } else if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  }
}
