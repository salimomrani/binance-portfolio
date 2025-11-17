// T048: Percentage formatting pipe

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'percentageFormat',
  standalone: true
})
export class PercentageFormatPipe implements PipeTransform {
  /**
   * Formats a number as percentage with color coding for gain/loss
   * @param value - The percentage value
   * @param decimals - Number of decimal places (default: 2)
   */
  transform(value: number | null | undefined, decimals: number = 2): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00%';
    }

    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
  }
}
