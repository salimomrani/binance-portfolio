// T109: Gain/Loss Badge Component

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { PercentageFormatPipe } from '../../pipes/percentage-format.pipe';

@Component({
  selector: 'app-gain-loss-badge',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe, PercentageFormatPipe],
  templateUrl: './gain-loss-badge.component.html',
  styleUrls: ['./gain-loss-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GainLossBadgeComponent {
  @Input() value!: number;
  @Input() percentage!: number;
  @Input() showPercentage = true;
  @Input() showArrow = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  get isProfit(): boolean {
    return this.value > 0;
  }

  get isLoss(): boolean {
    return this.value < 0;
  }

  get isNeutral(): boolean {
    return this.value === 0;
  }

  get colorClass(): string {
    if (this.isProfit) return 'text-profit';
    if (this.isLoss) return 'text-loss';
    return 'text-neutral';
  }

  get bgColorClass(): string {
    if (this.isProfit) return 'bg-profit-light';
    if (this.isLoss) return 'bg-loss-light';
    return 'bg-neutral-light';
  }

  get arrowIcon(): string {
    if (this.isProfit) return '↑';
    if (this.isLoss) return '↓';
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
}
