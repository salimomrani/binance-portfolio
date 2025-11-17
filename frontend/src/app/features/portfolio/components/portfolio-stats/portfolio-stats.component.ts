// T115: Portfolio Statistics Component

import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioStatistics } from '../../../../shared/models/portfolio.model';
import { GainLossBadgeComponent } from '../../../../shared/components/gain-loss-badge/gain-loss-badge.component';

@Component({
  selector: 'app-portfolio-stats',
  standalone: true,
  imports: [CommonModule, GainLossBadgeComponent],
  templateUrl: './portfolio-stats.component.html',
  styleUrl: './portfolio-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioStatsComponent {
  statistics = input<PortfolioStatistics | null>(null);

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'always',
    }).format(value / 100);
  }
}
