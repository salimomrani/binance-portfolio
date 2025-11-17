// T082-T084, T110: Portfolio table component with sortable columns and gain/loss badge

import { Component, input, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Holding } from '../../../../shared/models/portfolio.model';
import { GainLossBadgeComponent } from '../../../../shared/components/gain-loss-badge/gain-loss-badge.component';
import { TrendIndicatorComponent } from '../../../../shared/components/trend-indicator/trend-indicator.component';

type SortColumn = 'symbol' | 'quantity' | 'currentValue' | 'gainLoss' | 'gainLossPercentage' | 'priceChange24h' | 'volume24h' | 'marketCap';
type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-portfolio-table',
  standalone: true,
  imports: [CommonModule, GainLossBadgeComponent, TrendIndicatorComponent],
  templateUrl: './portfolio-table.component.html',
  styleUrl: './portfolio-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioTableComponent {
  // Signal-based inputs (Angular 17+)
  holdings = input<Holding[]>([]);

  private readonly sortColumn = signal<SortColumn>('currentValue');
  private readonly sortOrder = signal<SortOrder>('desc');

  // Computed sorted holdings
  protected readonly sortedHoldings = computed(() => {
    const holdings = [...this.holdings()];
    const column = this.sortColumn();
    const order = this.sortOrder();

    return holdings.sort((a, b) => {
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

  protected readonly isEmpty = computed(() => this.holdings().length === 0);

  /**
   * Handle column sort
   */
  onSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      // Toggle order if same column
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with default desc order
      this.sortColumn.set(column);
      this.sortOrder.set('desc');
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
   * Get CSS class for gain/loss
   */
  getGainLossClass(gainLoss: number): string {
    if (gainLoss > 0) return 'text-profit';
    if (gainLoss < 0) return 'text-loss';
    return 'text-gray-600';
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
   * Format quantity with appropriate decimals
   */
  formatQuantity(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(value);
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
}
