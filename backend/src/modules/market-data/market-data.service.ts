// T053: Market data service with adapter pattern and caching
// T143: Enhanced to support full market data with all trend indicators

import { BinanceAdapter } from './binance.adapter';
import { CoinGeckoAdapter } from './coingecko.adapter';
import type { MarketDataCache, createMarketDataCache } from './market-data.cache';
import type { MarketDataRepository } from './market-data.repository';
import { MarketDataAdapter, CryptoPrice, CryptoMarketData, PriceHistory, Timeframe, AdapterConfig } from './market-data.types';
import { logger } from '../../shared/services/logger.service';
import type { CacheService } from '../../shared/services/cache.service';
import { retry } from '../../shared/utils/retry.util';

/**
 * Market Data Service Type
 */
export type MarketDataService = {
  getCurrentPrice: (symbol: string) => Promise<CryptoPrice>;
  getFullMarketData: (symbol: string) => Promise<CryptoMarketData>;
  getMultiplePrices: (symbols: string[]) => Promise<Map<string, CryptoPrice>>;
  getHistoricalPrices: (symbol: string, timeframe: Timeframe) => Promise<PriceHistory[]>;
  getAdapterStatus: () => Promise<{
    primary: boolean;
    fallback: boolean;
    activeFallback: boolean;
  }>;
  clearCache: () => Promise<void>;
  getBinanceAdapter: () => BinanceAdapter;
};

/**
 * Create Market Data Service
 * Factory function for creating market data service instance
 */
export const createMarketDataService = (
  config: AdapterConfig,
  repository: MarketDataRepository,
  cacheService: CacheService,
  createCacheFn: typeof createMarketDataCache
): MarketDataService => {
  // Primary adapter: Binance
  const primaryAdapter: MarketDataAdapter = new BinanceAdapter(config);

  // Fallback adapter: CoinGecko
  const fallbackAdapter: MarketDataAdapter = new CoinGeckoAdapter(config);

  // Cache layer (uses repository for database operations)
  const cache: MarketDataCache = createCacheFn(repository, cacheService);

  return {
    /**
     * Get current price for a single symbol
     * Uses cache first, then primary adapter, then fallback
     */
    getCurrentPrice: async (symbol: string) => {
      try {
        // Check cache first
        const cached = await cache.getPrice(symbol);
        if (cached) {
          return cached;
        }

        // Try primary adapter
        try {
          const price = await retry(() => primaryAdapter.getCurrentPrice(symbol), {
            retries: 3,
            delay: 1000,
          });

          // Cache the result
          await cache.setPrice(symbol, price);
          return price;
        } catch (primaryError) {
          logger.warn(`Primary adapter failed for ${symbol}, trying fallback`, primaryError);

          // Try fallback adapter
          const price = await retry(() => fallbackAdapter.getCurrentPrice(symbol), {
            retries: 2,
            delay: 1500,
          });

          // Cache the result
          await cache.setPrice(symbol, price);
          return price;
        }
      } catch (error) {
        logger.error(`Failed to get price for ${symbol}:`, error);
        throw new Error(`Unable to fetch price for ${symbol}`);
      }
    },

    /**
     * T143: Get full market data with all trend indicators
     * Returns complete CryptoMarketData including 1h, 24h, 7d, 30d changes
     */
    getFullMarketData: async (symbol: string) => {
      try {
        // Check cache first for full market data
        const cached = await cache.getFullMarketData(symbol);
        if (cached) {
          return cached;
        }

        // Try primary adapter
        try {
          const data = await retry(() => (primaryAdapter as BinanceAdapter).getFullMarketData(symbol), {
            retries: 3,
            delay: 1000,
          });

          // Cache the result
          await cache.setFullMarketData(symbol, data);
          return data;
        } catch (primaryError) {
          logger.warn(`Primary adapter failed for full market data ${symbol}, trying fallback`, primaryError);

          // Try fallback adapter
          const data = await retry(() => (fallbackAdapter as CoinGeckoAdapter).getFullMarketData?.(symbol), {
            retries: 2,
            delay: 1500,
          });

          if (!data) {
            throw new Error('Fallback adapter does not support full market data');
          }

          // Cache the result
          await cache.setFullMarketData(symbol, data);
          return data;
        }
      } catch (error) {
        logger.error(`Failed to get full market data for ${symbol}:`, error);
        throw new Error(`Unable to fetch full market data for ${symbol}`);
      }
    },

    /**
     * Get current prices for multiple symbols
     */
    getMultiplePrices: async (symbols: string[]) => {
      try {
        const prices = new Map<string, CryptoPrice>();
        const uncachedSymbols: string[] = [];

        // Check cache for all symbols
        for (const symbol of symbols) {
          const cached = await cache.getPrice(symbol);
          if (cached) {
            prices.set(symbol, cached);
          } else {
            uncachedSymbols.push(symbol);
          }
        }

        // Fetch uncached symbols
        if (uncachedSymbols.length > 0) {
          try {
            const fetchedPrices = await retry(
              () => primaryAdapter.getMultiplePrices(uncachedSymbols),
              { retries: 3, delay: 1000 }
            );

            // Merge and cache
            for (const [symbol, price] of fetchedPrices.entries()) {
              prices.set(symbol, price);
              await cache.setPrice(symbol, price);
            }
          } catch (primaryError) {
            logger.warn('Primary adapter failed for multiple prices, trying fallback', primaryError);

            const fetchedPrices = await retry(
              () => fallbackAdapter.getMultiplePrices(uncachedSymbols),
              { retries: 2, delay: 1500 }
            );

            for (const [symbol, price] of fetchedPrices.entries()) {
              prices.set(symbol, price);
              await cache.setPrice(symbol, price);
            }
          }
        }

        return prices;
      } catch (error) {
        logger.error('Failed to get multiple prices:', error);
        throw new Error('Unable to fetch cryptocurrency prices');
      }
    },

    /**
     * Get historical prices for a symbol
     * T121: Enhanced with caching (5 min TTL)
     */
    getHistoricalPrices: async (symbol: string, timeframe: Timeframe) => {
      try {
        // Check cache first
        const cached = await cache.getHistoricalPrices(symbol, timeframe);
        if (cached) {
          return cached;
        }

        // Try primary adapter
        try {
          const history = await retry(() => primaryAdapter.getHistoricalPrices(symbol, timeframe), {
            retries: 3,
            delay: 1000,
          });

          // Cache the result
          await cache.setHistoricalPrices(symbol, timeframe, history);
          return history;
        } catch (primaryError) {
          logger.warn(`Primary adapter failed for historical data ${symbol}, trying fallback`, primaryError);

          // Try fallback adapter
          const history = await retry(() => fallbackAdapter.getHistoricalPrices(symbol, timeframe), {
            retries: 2,
            delay: 1500,
          });

          // Cache the result
          await cache.setHistoricalPrices(symbol, timeframe, history);
          return history;
        }
      } catch (error) {
        logger.error(`Failed to get historical prices for ${symbol}:`, error);
        throw new Error(`Unable to fetch historical data for ${symbol}`);
      }
    },

    /**
     * Check adapter health status
     */
    getAdapterStatus: async () => {
      const [primaryAvailable, fallbackAvailable] = await Promise.all([
        primaryAdapter.isAvailable(),
        fallbackAdapter.isAvailable(),
      ]);

      return {
        primary: primaryAvailable,
        fallback: fallbackAvailable,
        activeFallback: !primaryAvailable && fallbackAvailable,
      };
    },

    /**
     * Clear all cached prices
     */
    clearCache: async () => {
      await cache.clearAll();
    },

    /**
     * Get the Binance adapter instance (for authenticated operations like account sync)
     */
    getBinanceAdapter: () => {
      if (!(primaryAdapter instanceof BinanceAdapter)) {
        throw new Error('Primary adapter is not BinanceAdapter');
      }
      return primaryAdapter;
    },
  };
};
