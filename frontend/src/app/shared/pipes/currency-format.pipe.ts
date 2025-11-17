// T047: Currency formatting pipe

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
  /**
   * Formats a number as USD currency
   * @param value - The number to format
   * @param decimals - Number of decimal places (default: 2)
   */
  transform(value: number | null | undefined, decimals: number = 2): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '$0.00';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
}
