// T147: Trend calculation and formatting utilities

export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Calculate trend direction based on percentage change
 * @param change24h - 24 hour percentage change
 * @param threshold - Threshold for neutral trend (default: 0.5%)
 * @returns Trend direction: 'up', 'down', or 'neutral'
 */
export function calculateTrend(change24h: number, threshold: number = 0.5): TrendDirection {
  if (change24h > threshold) {
    return 'up';
  } else if (change24h < -threshold) {
    return 'down';
  } else {
    return 'neutral';
  }
}

/**
 * Format market cap value to human-readable string
 * @param value - Market cap value
 * @returns Formatted string (e.g., "$1.2T", "$45.3B", "$123.4M")
 */
export function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
  } else if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

/**
 * Format volume value to human-readable string
 * @param value - Volume value
 * @returns Formatted string (e.g., "$45.3B", "$123.4M", "$5.6K")
 */
export function formatVolume(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

/**
 * Format percentage change with sign
 * @param change - Percentage change value
 * @returns Formatted string with sign (e.g., "+2.5%", "-1.3%", "0.0%")
 */
export function formatPercentageChange(change: number): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Determine trend color based on percentage change
 * @param change - Percentage change value
 * @returns Color identifier: 'green', 'red', or 'gray'
 */
export function getTrendColor(change: number): 'green' | 'red' | 'gray' {
  if (change > 0) {
    return 'green';
  } else if (change < 0) {
    return 'red';
  } else {
    return 'gray';
  }
}

/**
 * Get trend arrow symbol based on direction
 * @param trend - Trend direction
 * @returns Arrow symbol: '↑', '↓', or '→'
 */
export function getTrendArrow(trend: TrendDirection): string {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'neutral':
      return '→';
  }
}

/**
 * Calculate relative strength index (simplified)
 * @param changes - Array of price changes
 * @returns RSI value (0-100)
 */
export function calculateRSI(changes: number[]): number {
  if (changes.length === 0) {
    return 50; // Neutral
  }

  const gains = changes.filter((c) => c > 0);
  const losses = changes.filter((c) => c < 0).map((c) => Math.abs(c));

  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

  if (avgLoss === 0) {
    return 100; // All gains
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return parseFloat(rsi.toFixed(2));
}

/**
 * Determine if a price is at or near a resistance level
 * @param currentPrice - Current price
 * @param high24h - 24 hour high
 * @param threshold - Threshold percentage (default: 2%)
 * @returns True if near resistance
 */
export function isNearResistance(
  currentPrice: number,
  high24h: number,
  threshold: number = 2
): boolean {
  if (!high24h) return false;
  const percentFromHigh = ((high24h - currentPrice) / high24h) * 100;
  return percentFromHigh <= threshold;
}

/**
 * Determine if a price is at or near a support level
 * @param currentPrice - Current price
 * @param low24h - 24 hour low
 * @param threshold - Threshold percentage (default: 2%)
 * @returns True if near support
 */
export function isNearSupport(
  currentPrice: number,
  low24h: number,
  threshold: number = 2
): boolean {
  if (!low24h) return false;
  const percentFromLow = ((currentPrice - low24h) / low24h) * 100;
  return percentFromLow <= threshold;
}
