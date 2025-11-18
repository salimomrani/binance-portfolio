import { Decimal } from 'decimal.js';

/**
 * Decimal utility functions for precise monetary calculations
 * Uses Decimal.js to avoid floating-point precision errors
 */

// Configure Decimal.js globally
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Convert value to Decimal
 */
export function toDecimal(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

/**
 * Add two decimal values
 */
export function add(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return toDecimal(a).plus(toDecimal(b));
}

/**
 * Subtract two decimal values
 */
export function subtract(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

/**
 * Multiply two decimal values
 */
export function multiply(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return toDecimal(a).times(toDecimal(b));
}

/**
 * Divide two decimal values
 */
export function divide(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  if (toDecimal(b).isZero()) {
    throw new Error('Division by zero');
  }
  return toDecimal(a).dividedBy(toDecimal(b));
}

/**
 * Calculate percentage
 */
export function percentage(
  value: string | number | Decimal,
  total: string | number | Decimal
): Decimal {
  if (toDecimal(total).isZero()) {
    return new Decimal(0);
  }
  return toDecimal(value).dividedBy(toDecimal(total)).times(100);
}

/**
 * Calculate percentage change
 */
export function percentageChange(
  oldValue: string | number | Decimal,
  newValue: string | number | Decimal
): Decimal {
  const old = toDecimal(oldValue);
  if (old.isZero()) {
    return new Decimal(0);
  }
  return toDecimal(newValue).minus(old).dividedBy(old).times(100);
}

/**
 * Round to specified decimal places
 */
export function round(value: string | number | Decimal, decimalPlaces: number = 2): Decimal {
  return toDecimal(value).toDecimalPlaces(decimalPlaces);
}

/**
 * Format as USD currency
 */
export function formatUSD(value: string | number | Decimal, decimals: number = 2): string {
  return `$${toDecimal(value).toFixed(decimals)}`;
}

/**
 * Format as percentage
 */
export function formatPercentage(value: string | number | Decimal, decimals: number = 2): string {
  return `${toDecimal(value).toFixed(decimals)}%`;
}

/**
 * Check if value is zero
 */
export function isZero(value: string | number | Decimal): boolean {
  return toDecimal(value).isZero();
}

/**
 * Check if value is positive
 */
export function isPositive(value: string | number | Decimal): boolean {
  return toDecimal(value).isPositive();
}

/**
 * Check if value is negative
 */
export function isNegative(value: string | number | Decimal): boolean {
  return toDecimal(value).isNegative();
}

/**
 * Get absolute value
 */
export function abs(value: string | number | Decimal): Decimal {
  return toDecimal(value).abs();
}

/**
 * Compare two decimal values
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compare(a: string | number | Decimal, b: string | number | Decimal): number {
  return toDecimal(a).comparedTo(toDecimal(b));
}
