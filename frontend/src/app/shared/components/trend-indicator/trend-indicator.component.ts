// T150: Trend Indicator Component

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
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
  @Input() change!: number;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showArrow = true;
  @Input() threshold = 0.5; // Default threshold for neutral (±0.5%)

  get trend(): TrendDirection {
    if (this.change > this.threshold) {
      return 'up';
    } else if (this.change < -this.threshold) {
      return 'down';
    } else {
      return 'neutral';
    }
  }

  get isUptrend(): boolean {
    return this.trend === 'up';
  }

  get isDowntrend(): boolean {
    return this.trend === 'down';
  }

  get isNeutral(): boolean {
    return this.trend === 'neutral';
  }

  get colorClass(): string {
    if (this.isUptrend) return 'text-green-600';
    if (this.isDowntrend) return 'text-red-600';
    return 'text-gray-500';
  }

  get bgColorClass(): string {
    if (this.isUptrend) return 'bg-green-50';
    if (this.isDowntrend) return 'bg-red-50';
    return 'bg-gray-50';
  }

  get arrowIcon(): string {
    if (this.isUptrend) return '↑';
    if (this.isDowntrend) return '↓';
    return '→';
  }

  get sizeClasses(): string {
    const sizeMap = {
      small: 'text-xs px-2 py-0.5',
      medium: 'text-sm px-3 py-1',
      large: 'text-base px-4 py-1.5',
    };
    return sizeMap[this.size];
  }

  get formattedChange(): string {
    const sign = this.change > 0 ? '+' : '';
    return `${sign}${this.change.toFixed(2)}%`;
  }
}
