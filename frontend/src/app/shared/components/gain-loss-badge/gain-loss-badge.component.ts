// T109: Gain/Loss Badge Component

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
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
  // Signal inputs
  value = input.required<number>();
  percentage = input.required<number>();
  showPercentage = input<boolean>(true);
  showArrow = input<boolean>(true);
  size = input<'small' | 'medium' | 'large'>('medium');

  // Computed signals
  protected readonly isProfit = computed(() => this.value() > 0);
  protected readonly isLoss = computed(() => this.value() < 0);
  protected readonly isNeutral = computed(() => this.value() === 0);

  protected readonly colorClass = computed(() => {
    if (this.isProfit()) return 'text-profit';
    if (this.isLoss()) return 'text-loss';
    return 'text-neutral';
  });

  protected readonly bgColorClass = computed(() => {
    if (this.isProfit()) return 'bg-profit-light';
    if (this.isLoss()) return 'bg-loss-light';
    return 'bg-neutral-light';
  });

  protected readonly arrowIcon = computed(() => {
    if (this.isProfit()) return '↑';
    if (this.isLoss()) return '↓';
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
}
