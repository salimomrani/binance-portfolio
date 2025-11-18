// Crypto symbol validation utility
// Filters out invalid or unsupported cryptocurrency symbols

import { logger } from '../services/logger.service';

/**
 * Prefixes for Binance-specific tokens that don't have standard trading pairs
 * These are derivative products, wrapped tokens, or platform-specific assets
 */
const INVALID_SYMBOL_PREFIXES = [
  'LD', // Binance Liquid Swap tokens (LDBNB, LDETH, etc.)
  'RW', // Binance wrapped tokens
  'BS', // Binance Savings tokens
  'BN', // Binance-specific tokens
];

/**
 * Symbols that should be excluded from price fetching
 * These are typically stablecoins pegged to USD or fiat-backed assets
 */
const EXCLUDED_SYMBOLS = new Set([
  'USDT', // Tether (used as quote currency)
  'BUSD', // Binance USD (deprecated)
  'USDC', // USD Coin (often used as quote currency)
  'DAI', // Dai stablecoin
  'TUSD', // TrueUSD
  'USDP', // Pax Dollar
  'FDUSD', // First Digital USD
]);

/**
 * Check if a cryptocurrency symbol is valid for price fetching
 * Returns false for:
 * - Binance-specific derivative tokens (LD, RW, BS prefixes)
 * - Stablecoins used as quote currencies
 * - Empty or invalid symbols
 */
export function isValidCryptoSymbol(symbol: string): boolean {
  if (!symbol || symbol.trim().length === 0) {
    return false;
  }

  const upperSymbol = symbol.toUpperCase().trim();

  // Check if symbol is in excluded list
  if (EXCLUDED_SYMBOLS.has(upperSymbol)) {
    return false;
  }

  // Check if symbol starts with invalid prefix
  for (const prefix of INVALID_SYMBOL_PREFIXES) {
    if (upperSymbol.startsWith(prefix)) {
      return false;
    }
  }

  return true;
}

/**
 * Filter a list of symbols to only include valid ones
 * Logs warnings for filtered symbols
 */
export function filterValidSymbols(symbols: string[]): string[] {
  const validSymbols: string[] = [];
  const invalidSymbols: string[] = [];

  for (const symbol of symbols) {
    if (isValidCryptoSymbol(symbol)) {
      validSymbols.push(symbol);
    } else {
      invalidSymbols.push(symbol);
    }
  }

  if (invalidSymbols.length > 0) {
    logger.warn(`Filtered out ${invalidSymbols.length} invalid/unsupported symbols:`, {
      symbols: invalidSymbols.join(', '),
      reason: 'Binance-specific tokens or stablecoins excluded from price fetching',
    });
  }

  return validSymbols;
}

/**
 * Get a user-friendly reason why a symbol was filtered
 */
export function getSymbolFilterReason(symbol: string): string {
  if (!symbol || symbol.trim().length === 0) {
    return 'Empty or invalid symbol';
  }

  const upperSymbol = symbol.toUpperCase().trim();

  if (EXCLUDED_SYMBOLS.has(upperSymbol)) {
    return 'Stablecoin used as quote currency';
  }

  for (const prefix of INVALID_SYMBOL_PREFIXES) {
    if (upperSymbol.startsWith(prefix)) {
      return `Binance-specific token with ${prefix} prefix (not supported for price fetching)`;
    }
  }

  return 'Valid symbol';
}
