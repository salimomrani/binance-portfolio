// T150: Trend Indicator Component

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TrendDirection = 'up' | 'down' | 'neutral';

@Component({
  selector: 'app-trend-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trend-indicator.component.html',
  styleUrls: ['./trend-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendIndicatorComponent {
  // Signal inputs
  change = input.required<number>();
  size = input<'small' | 'medium' | 'large'>('medium');
  showArrow = input<boolean>(true);
  threshold = input<number>(0.5); // Default threshold for neutral (±0.5%)

  // Computed signals
  protected readonly trend = computed<TrendDirection>(() => {
    if (this.change() > this.threshold()) {
      return 'up';
    } else if (this.change() < -this.threshold()) {
      return 'down';
    } else {
      return 'neutral';
    }
  });

  protected readonly isUptrend = computed(() => this.trend() === 'up');
  protected readonly isDowntrend = computed(() => this.trend() === 'down');
  protected readonly isNeutral = computed(() => this.trend() === 'neutral');

  protected readonly colorClass = computed(() => {
    if (this.isUptrend()) return 'text-green-600';
    if (this.isDowntrend()) return 'text-red-600';
    return 'text-gray-500';
  });

  protected readonly bgColorClass = computed(() => {
    if (this.isUptrend()) return 'bg-green-50';
    if (this.isDowntrend()) return 'bg-red-50';
    return 'bg-gray-50';
  });

  protected readonly arrowIcon = computed(() => {
    if (this.isUptrend()) return '↑';
    if (this.isDowntrend()) return '↓';
    return '→';
  });

  protected readonly sizeClasses = computed(() => {
    const sizeMap = {
      small: 'text-xs px-2 py-0.5',
      medium: 'text-sm px-3 py-1',
      large: 'text-base px-4 py-1.5',
    };
    return sizeMap[this.size()];
  });

  protected readonly formattedChange = computed(() => {
    const sign = this.change() > 0 ? '+' : '';
    return `${sign}${this.change().toFixed(2)}%`;
  });
}
