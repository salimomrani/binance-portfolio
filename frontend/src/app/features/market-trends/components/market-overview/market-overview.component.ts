// T152: Market Overview Component

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CryptoPrice } from '../../../../shared/models/crypto-market-data.model';
import { MarketDataApiService } from '../../services/market-data-api.service';
import { TrendIndicatorComponent } from '../../../../shared/components/trend-indicator/trend-indicator.component';

@Component({
  selector: 'app-market-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, TrendIndicatorComponent],
  templateUrl: './market-overview.component.html',
  styleUrls: ['./market-overview.component.scss'],
})
export class MarketOverviewComponent implements OnInit {
  private readonly marketDataApi = inject(MarketDataApiService);

  protected readonly topGainers = signal<CryptoPrice[]>([]);
  protected readonly topLosers = signal<CryptoPrice[]>([]);
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  // Popular cryptocurrency symbols to fetch
  private readonly symbols = [
    'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOT', 'DOGE',
    'MATIC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'ETC',
    'XLM', 'ALGO', 'VET', 'ICP', 'FIL'
  ];

  ngOnInit(): void {
    this.loadMarketData();
  }

  private loadMarketData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.marketDataApi.getMultiplePrices(this.symbols).subscribe({
      next: (prices) => {
        // Sort by change24h descending for top gainers
        const gainers = [...prices]
          .sort((a, b) => b.change24h - a.change24h)
          .slice(0, 10);

        // Sort by change24h ascending for top losers
        const losers = [...prices]
          .sort((a, b) => a.change24h - b.change24h)
          .slice(0, 10);

        this.topGainers.set(gainers);
        this.topLosers.set(losers);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load market data:', err);
        this.error.set('Failed to load market data. Please try again later.');
        this.loading.set(false);
      },
    });
  }

  protected formatCurrency(value: number): string {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  }

  protected formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price);
  }

  protected refresh(): void {
    this.loadMarketData();
  }
}
