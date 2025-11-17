// T126: Chart colors utility with predefined color palette for cryptocurrencies

/**
 * Predefined color palette for cryptocurrency charts
 * Colors are designed to be distinct and visually appealing
 */
export const CRYPTO_COLOR_PALETTE = [
  '#F7931A', // Bitcoin Orange
  '#627EEA', // Ethereum Blue
  '#0033AD', // Cardano Blue
  '#26A17B', // Tether Green
  '#F3BA2F', // Binance Coin Yellow
  '#2775CA', // XRP Blue
  '#8247E5', // Solana Purple
  '#00D395', // USD Coin Green
  '#E84142', // Polkadot Pink
  '#14151A', // Polygon Dark
  '#FFD93D', // Dogecoin Yellow
  '#FF6B6B', // Generic Red
  '#4ECDC4', // Generic Teal
  '#95E1D3', // Generic Mint
  '#FFB6C1', // Generic Light Pink
] as const;

/**
 * Get color for a specific index
 * Cycles through palette if index exceeds palette length
 */
export function getChartColor(index: number): string {
  return CRYPTO_COLOR_PALETTE[index % CRYPTO_COLOR_PALETTE.length];
}

/**
 * Get colors for an array of items
 */
export function getChartColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => getChartColor(i));
}

/**
 * Get color with opacity
 */
export function getChartColorWithAlpha(index: number, alpha: number): string {
  const color = getChartColor(index);
  return hexToRgba(color, alpha);
}

/**
 * Convert hex color to rgba with alpha
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Chart gradient colors for line charts
 */
export function createGradient(
  ctx: CanvasRenderingContext2D,
  color: string
): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, hexToRgba(color, 0.5));
  gradient.addColorStop(1, hexToRgba(color, 0.0));
  return gradient;
}

/**
 * Get profit/loss color
 */
export function getProfitLossColor(value: number): string {
  if (value > 0) return '#10B981'; // Green for profit
  if (value < 0) return '#EF4444'; // Red for loss
  return '#6B7280'; // Gray for neutral
}
