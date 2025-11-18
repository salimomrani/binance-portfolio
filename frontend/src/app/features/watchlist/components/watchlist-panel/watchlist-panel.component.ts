// T171-T173: Watchlist panel component displaying watchlist items in table format

import {
  Component,
  output,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { WatchlistItem } from '../../../../shared/models/watchlist.model';
import { TrendIndicatorComponent } from '../../../../shared/components/trend-indicator/trend-indicator.component';
import { PriceFlashDirective } from '../../../../shared/directives/price-flash.directive';
import { PriceUpdateService } from '../../../../core/services/price-update.service';
import {
  selectAllWatchlistItems,
  selectWatchlistLoading,
  selectWatchlistError,
} from '../../store/watchlist.selectors';
import { WatchlistActions } from '../../store/watchlist.actions';

type SortColumn =
  | 'symbol'
  | 'currentPrice'
  | 'change24h'
  | 'volume24h'
  | 'marketCap';
type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-watchlist-panel',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TrendIndicatorComponent,
    PriceFlashDirective,
  ],
  templateUrl: './watchlist-panel.component.html',
  styleUrl: './watchlist-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistPanelComponent implements OnInit {
  // Signal-based output for add to watchlist action
  addToWatchlist = output<void>();

  private readonly store = inject(Store);
  private readonly priceUpdateService = inject(PriceUpdateService);

  // State from store
  protected readonly items = this.store.selectSignal(selectAllWatchlistItems);
  protected readonly loading = this.store.selectSignal(selectWatchlistLoading);
  protected readonly error = this.store.selectSignal(selectWatchlistError);

  // Local state for sorting
  private readonly sortColumn = signal<SortColumn>('symbol');
  private readonly sortOrder = signal<SortOrder>('asc');

  // Computed sorted items
  protected readonly sortedItems = computed(() => {
    const items = [...this.items()];
    const column = this.sortColumn();
    const order = this.sortOrder();

    return items.sort((a, b) => {
      let aValue = a[column];
      let bValue = b[column];

      // Handle string comparison for symbol
      if (column === 'symbol') {
        aValue = (aValue as string).toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  });

  protected readonly isEmpty = computed(() => this.items().length === 0);

  ngOnInit(): void {
    // Load watchlist on component init
    this.store.dispatch(WatchlistActions.loadWatchlist());
  }

  /**
   * Handle column sort
   */
  onSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      // Toggle order if same column
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with default asc order
      this.sortColumn.set(column);
      this.sortOrder.set('asc');
    }
  }

  /**
   * Get sort icon for column
   */
  getSortIcon(column: SortColumn): string {
    if (this.sortColumn() !== column) {
      return 'sort';
    }
    return this.sortOrder() === 'asc' ? 'sort-asc' : 'sort-desc';
  }

  /**
   * Check if column is currently sorted
   */
  isSorted(column: SortColumn): boolean {
    return this.sortColumn() === column;
  }

  /**
   * Handle remove from watchlist
   */
  onRemove(itemId: string): void {
    if (confirm('Are you sure you want to remove this item from your watchlist?')) {
      this.store.dispatch(
        WatchlistActions.removeFromWatchlist({ itemId })
      );
    }
  }

  /**
   * Handle add to watchlist button click
   */
  onAddToWatchlist(): void {
    this.addToWatchlist.emit();
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'always',
    }).format(value / 100);
  }

  /**
   * Format large numbers (volume, market cap) with K, M, B, T suffixes
   */
  formatLargeNumber(value: number): string {
    if (value === 0) return '$0';

    const absValue = Math.abs(value);

    if (absValue >= 1_000_000_000_000) {
      return '$' + (value / 1_000_000_000_000).toFixed(2) + 'T';
    } else if (absValue >= 1_000_000_000) {
      return '$' + (value / 1_000_000_000).toFixed(2) + 'B';
    } else if (absValue >= 1_000_000) {
      return '$' + (value / 1_000_000).toFixed(2) + 'M';
    } else if (absValue >= 1_000) {
      return '$' + (value / 1_000).toFixed(2) + 'K';
    } else {
      return this.formatCurrency(value);
    }
  }

  /**
   * Get previous price for a symbol from price update service
   */
  getPreviousPrice(symbol: string): number | undefined {
    return this.priceUpdateService.getPriceForSymbol(symbol)?.previousPrice;
  }

  /**
   * Format date
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  }
}
