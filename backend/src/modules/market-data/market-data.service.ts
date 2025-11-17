// T053: Market data service with adapter pattern and caching
// T143: Enhanced to support full market data with all trend indicators

import { PrismaClient } from '@prisma/client';
import { BinanceAdapter } from './binance.adapter';
import { CoinGeckoAdapter } from './coingecko.adapter';
import { MarketDataCache } from './market-data.cache';
import { MarketDataAdapter, CryptoPrice, CryptoMarketData, PriceHistory, Timeframe, AdapterConfig } from './market-data.types';
import { logger } from '../../shared/services/logger.service';
import { CacheService } from '../../shared/services/cache.service';
import { retry } from '../../shared/utils/retry.util';

export class MarketDataService {
  private readonly primaryAdapter: MarketDataAdapter;
  private readonly fallbackAdapter: MarketDataAdapter;
  private readonly cache: MarketDataCache;

  constructor(config: AdapterConfig, prisma: PrismaClient, cacheService: CacheService) {
    // Primary adapter: Binance
    this.primaryAdapter = new BinanceAdapter(config);

    // Fallback adapter: CoinGecko
    this.fallbackAdapter = new CoinGeckoAdapter(config);

    // Cache layer
    this.cache = new MarketDataCache(prisma, cacheService);
  }

  /**
   * Get current price for a single symbol
   * Uses cache first, then primary adapter, then fallback
   */
  async getCurrentPrice(symbol: string): Promise<CryptoPrice> {
    try {
      // Check cache first
      const cached = await this.cache.getPrice(symbol);
      if (cached) {
        return cached;
      }

      // Try primary adapter
      try {
        const price = await retry(() => this.primaryAdapter.getCurrentPrice(symbol), {
          retries: 3,
          delay: 1000,
        });

        // Cache the result
        await this.cache.setPrice(symbol, price);
        return price;
      } catch (primaryError) {
        logger.warn(`Primary adapter failed for ${symbol}, trying fallback`, primaryError);

        // Try fallback adapter
        const price = await retry(() => this.fallbackAdapter.getCurrentPrice(symbol), {
          retries: 2,
          delay: 1500,
        });

        // Cache the result
        await this.cache.setPrice(symbol, price);
        return price;
      }
    } catch (error) {
      logger.error(`Failed to get price for ${symbol}:`, error);
      throw new Error(`Unable to fetch price for ${symbol}`);
    }
  }

  /**
   * T143: Get full market data with all trend indicators
   * Returns complete CryptoMarketData including 1h, 24h, 7d, 30d changes
   */
  async getFullMarketData(symbol: string): Promise<CryptoMarketData> {
    try {
      // Check cache first for full market data
      const cached = await this.cache.getFullMarketData(symbol);
      if (cached) {
        return cached;
      }

      // Try primary adapter
      try {
        const data = await retry(() => (this.primaryAdapter as BinanceAdapter).getFullMarketData(symbol), {
          retries: 3,
          delay: 1000,
        });

        // Cache the result
        await this.cache.setFullMarketData(symbol, data);
        return data;
      } catch (primaryError) {
        logger.warn(`Primary adapter failed for full market data ${symbol}, trying fallback`, primaryError);

        // Try fallback adapter
        const data = await retry(() => (this.fallbackAdapter as CoinGeckoAdapter).getFullMarketData?.(symbol), {
          retries: 2,
          delay: 1500,
        });

        if (!data) {
          throw new Error('Fallback adapter does not support full market data');
        }

        // Cache the result
        await this.cache.setFullMarketData(symbol, data);
        return data;
      }
    } catch (error) {
      logger.error(`Failed to get full market data for ${symbol}:`, error);
      throw new Error(`Unable to fetch full market data for ${symbol}`);
    }
  }

  /**
   * Get current prices for multiple symbols
   */
  async getMultiplePrices(symbols: string[]): Promise<Map<string, CryptoPrice>> {
    try {
      const prices = new Map<string, CryptoPrice>();
      const uncachedSymbols: string[] = [];

      // Check cache for all symbols
      for (const symbol of symbols) {
        const cached = await this.cache.getPrice(symbol);
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
            () => this.primaryAdapter.getMultiplePrices(uncachedSymbols),
            { retries: 3, delay: 1000 }
          );

          // Merge and cache
          for (const [symbol, price] of fetchedPrices.entries()) {
            prices.set(symbol, price);
            await this.cache.setPrice(symbol, price);
          }
        } catch (primaryError) {
          logger.warn('Primary adapter failed for multiple prices, trying fallback', primaryError);

          const fetchedPrices = await retry(
            () => this.fallbackAdapter.getMultiplePrices(uncachedSymbols),
            { retries: 2, delay: 1500 }
          );

          for (const [symbol, price] of fetchedPrices.entries()) {
            prices.set(symbol, price);
            await this.cache.setPrice(symbol, price);
          }
        }
      }

      return prices;
    } catch (error) {
      logger.error('Failed to get multiple prices:', error);
      throw new Error('Unable to fetch cryptocurrency prices');
    }
  }

  /**
   * Get historical prices for a symbol
   * T121: Enhanced with caching (5 min TTL)
   */
  async getHistoricalPrices(symbol: string, timeframe: Timeframe): Promise<PriceHistory[]> {
    try {
      // Check cache first
      const cached = await this.cache.getHistoricalPrices(symbol, timeframe);
      if (cached) {
        return cached;
      }

      // Try primary adapter
      try {
        const history = await retry(() => this.primaryAdapter.getHistoricalPrices(symbol, timeframe), {
          retries: 3,
          delay: 1000,
        });

        // Cache the result
        await this.cache.setHistoricalPrices(symbol, timeframe, history);
        return history;
      } catch (primaryError) {
        logger.warn(`Primary adapter failed for historical data ${symbol}, trying fallback`, primaryError);

        // Try fallback adapter
        const history = await retry(() => this.fallbackAdapter.getHistoricalPrices(symbol, timeframe), {
          retries: 2,
          delay: 1500,
        });

        // Cache the result
        await this.cache.setHistoricalPrices(symbol, timeframe, history);
        return history;
      }
    } catch (error) {
      logger.error(`Failed to get historical prices for ${symbol}:`, error);
      throw new Error(`Unable to fetch historical data for ${symbol}`);
    }
  }

  /**
   * Check adapter health status
   */
  async getAdapterStatus(): Promise<{
    primary: boolean;
    fallback: boolean;
    activeFallback: boolean;
  }> {
    const [primaryAvailable, fallbackAvailable] = await Promise.all([
      this.primaryAdapter.isAvailable(),
      this.fallbackAdapter.isAvailable(),
    ]);

    return {
      primary: primaryAvailable,
      fallback: fallbackAvailable,
      activeFallback: !primaryAvailable && fallbackAvailable,
    };
  }

  /**
   * Clear all cached prices
   */
  async clearCache(): Promise<void> {
    await this.cache.clearAll();
  }
}
