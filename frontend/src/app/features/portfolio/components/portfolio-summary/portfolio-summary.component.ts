// T085-T086: Portfolio summary component (signal-based inputs)

import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Portfolio } from '../../../../shared/models/portfolio.model';

@Component({
  selector: 'app-portfolio-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio-summary.component.html',
  styleUrl: './portfolio-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioSummaryComponent {
  // Signal-based inputs (Angular 17+)
  portfolio = input<Portfolio | null>(null);
  lastUpdated = input<Date | null>(null);

  /**
   * Get CSS class for gain/loss
   */
  getGainLossClass(): string {
    const portfolio = this.portfolio();
    if (!portfolio) return 'text-gray-600';
    if (portfolio.totalGainLoss > 0) return 'text-profit';
    if (portfolio.totalGainLoss < 0) return 'text-loss';
    return 'text-gray-600';
  }

  /**
   * Get gain/loss icon
   */
  getGainLossIcon(): string {
    const portfolio = this.portfolio();
    if (!portfolio) return '';
    if (portfolio.totalGainLoss > 0) return 'trending-up';
    if (portfolio.totalGainLoss < 0) return 'trending-down';
    return '';
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
   * Get relative time string
   */
  getRelativeTime(): string {
    const lastUpdated = this.lastUpdated();
    if (!lastUpdated) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;

    return lastUpdated.toLocaleString();
  }
}
