// T054: Market data caching using Redis with in-memory fallback
// T122: Enhanced with historical data caching (5 min TTL)
// T146: Enhanced to support full market data caching

import { CryptoPrice, CryptoMarketData, PriceHistory, Timeframe } from './market-data.types';
import { logger } from '../../shared/services/logger.service';
import { CacheService } from '../../shared/services/cache.service';
import type { MarketDataRepository } from './market-data.repository';
import Decimal from 'decimal.js';

const CACHE_TTL = 60; // 60 seconds for current prices
const HISTORY_CACHE_TTL = 300; // 5 minutes for historical data
const DB_TTL = 120; // 2 minutes

/**
 * Market Data Cache Type
 */
export type MarketDataCache = {
  getPrice: (symbol: string) => Promise<CryptoPrice | null>;
  setPrice: (symbol: string, price: CryptoPrice) => Promise<void>;
  getFullMarketData: (symbol: string) => Promise<CryptoMarketData | null>;
  setFullMarketData: (symbol: string, data: CryptoMarketData) => Promise<void>;
  getPrices: (symbols: string[]) => Promise<Map<string, CryptoPrice>>;
  setPrices: (prices: Map<string, CryptoPrice>) => Promise<void>;
  getHistoricalPrices: (symbol: string, timeframe: Timeframe) => Promise<PriceHistory[] | null>;
  setHistoricalPrices: (symbol: string, timeframe: Timeframe, history: PriceHistory[]) => Promise<void>;
  clearAll: () => Promise<void>;
};

/**
 * Helper functions
 */
const isFresh = (lastUpdated: Date): boolean => {
  const now = new Date();
  const age = now.getTime() - lastUpdated.getTime();
  return age < DB_TTL * 1000;
};

const isHistoryFresh = (latestTimestamp: Date): boolean => {
  const now = new Date();
  const age = now.getTime() - latestTimestamp.getTime();
  return age < HISTORY_CACHE_TTL * 1000;
};

const dbToCryptoPrice = (dbPrice: {
  symbol: string;
  name: string;
  price: Decimal;
  change1h: Decimal;
  change24h: Decimal;
  change7d: Decimal;
  change30d: Decimal;
  volume24h: Decimal;
  marketCap: Decimal;
  high24h: Decimal | null;
  low24h: Decimal | null;
  lastUpdated: Date;
}): CryptoPrice => ({
  symbol: dbPrice.symbol,
  name: dbPrice.name,
  price: dbPrice.price.toNumber(),
  change1h: dbPrice.change1h.toNumber(),
  change24h: dbPrice.change24h.toNumber(),
  change7d: dbPrice.change7d.toNumber(),
  change30d: dbPrice.change30d.toNumber(),
  volume24h: dbPrice.volume24h.toNumber(),
  marketCap: dbPrice.marketCap.toNumber(),
  high24h: dbPrice.high24h?.toNumber() || undefined,
  low24h: dbPrice.low24h?.toNumber() || undefined,
  lastUpdated: dbPrice.lastUpdated,
});

const dbToCryptoMarketData = (dbPrice: {
  symbol: string;
  name: string;
  price: Decimal;
  change1h: Decimal;
  change24h: Decimal;
  change7d: Decimal;
  change30d: Decimal;
  volume24h: Decimal;
  marketCap: Decimal;
  high24h: Decimal | null;
  low24h: Decimal | null;
  lastUpdated: Date;
}): CryptoMarketData => ({
  symbol: dbPrice.symbol,
  name: dbPrice.name,
  price: dbPrice.price.toNumber(),
  change1h: dbPrice.change1h.toNumber(),
  change24h: dbPrice.change24h.toNumber(),
  change7d: dbPrice.change7d.toNumber(),
  change30d: dbPrice.change30d.toNumber(),
  volume24h: dbPrice.volume24h.toNumber(),
  marketCap: dbPrice.marketCap.toNumber(),
  high24h: dbPrice.high24h?.toNumber() || null,
  low24h: dbPrice.low24h?.toNumber() || null,
  lastUpdated: dbPrice.lastUpdated,
});

/**
 * Create Market Data Cache
 * Factory function for creating market data cache instance
 */
export const createMarketDataCache = (
  repository: MarketDataRepository,
  cache: CacheService
): MarketDataCache => {
  const cacheInstance: MarketDataCache = {
    /**
     * Get cached price for a symbol
     */
    getPrice: async (symbol: string) => {
      try {
        // Try Redis cache first
        const cacheKey = `price:${symbol}`;
        const cached = await cache.get<CryptoPrice>(cacheKey);

        if (cached) {
          logger.debug(`Cache hit for ${symbol}`);
          return cached;
        }

        // Try database cache
        const dbCached = await repository.findBySymbol(symbol);

        if (dbCached && isFresh(dbCached.lastUpdated)) {
          const price = dbToCryptoPrice(dbCached);
          // Restore to Redis cache
          await cache.set(cacheKey, price, CACHE_TTL);
          return price;
        }

        return null;
      } catch (error) {
        logger.error(`Error getting cached price for ${symbol}:`, error);
        return null;
      }
    },

    /**
     * Set cached price for a symbol
     */
    setPrice: async (symbol: string, price: CryptoPrice) => {
      try {
        const cacheKey = `price:${symbol}`;

        // Set in Redis cache
        await cache.set(cacheKey, price, CACHE_TTL);

        // Update database cache using repository
        await repository.upsert({
          symbol,
          name: price.name,
          price: price.price,
          change1h: price.change1h || 0,
          change24h: price.change24h,
          change7d: price.change7d || 0,
          change30d: price.change30d || 0,
          volume24h: price.volume24h,
          marketCap: price.marketCap,
          high24h: price.high24h || null,
          low24h: price.low24h || null,
          lastUpdated: price.lastUpdated,
        });

        logger.debug(`Cached price for ${symbol}`);
      } catch (error) {
        logger.error(`Error caching price for ${symbol}:`, error);
      }
    },

    /**
     * T146: Get cached full market data for a symbol
     */
    getFullMarketData: async (symbol: string) => {
      try {
        // Try Redis cache first
        const cacheKey = `market-data:${symbol}`;
        const cached = await cache.get<CryptoMarketData>(cacheKey);

        if (cached) {
          logger.debug(`Cache hit for full market data ${symbol}`);
          return cached;
        }

        // Try database cache
        const dbCached = await repository.findBySymbol(symbol);

        if (dbCached && isFresh(dbCached.lastUpdated)) {
          const marketData = dbToCryptoMarketData(dbCached);
          // Restore to Redis cache
          await cache.set(cacheKey, marketData, CACHE_TTL);
          return marketData;
        }

        return null;
      } catch (error) {
        logger.error(`Error getting cached full market data for ${symbol}:`, error);
        return null;
      }
    },

    /**
     * T146: Set cached full market data for a symbol
     */
    setFullMarketData: async (symbol: string, data: CryptoMarketData) => {
      try {
        const cacheKey = `market-data:${symbol}`;

        // Set in Redis cache
        await cache.set(cacheKey, data, CACHE_TTL);

        // Update database cache using repository
        await repository.upsert({
          symbol,
          name: data.name,
          price: data.price,
          change1h: data.change1h,
          change24h: data.change24h,
          change7d: data.change7d,
          change30d: data.change30d,
          volume24h: data.volume24h,
          marketCap: data.marketCap,
          high24h: data.high24h || null,
          low24h: data.low24h || null,
          lastUpdated: data.lastUpdated,
        });

        logger.debug(`Cached full market data for ${symbol}`);
      } catch (error) {
        logger.error(`Error caching full market data for ${symbol}:`, error);
      }
    },

    /**
     * Get cached prices for multiple symbols
     */
    getPrices: async (symbols: string[]) => {
      const prices = new Map<string, CryptoPrice>();

      await Promise.all(
        symbols.map(async symbol => {
          const price = await cacheInstance.getPrice(symbol);
          if (price) {
            prices.set(symbol, price);
          }
        })
      );

      return prices;
    },

    /**
     * Set cached prices for multiple symbols
     */
    setPrices: async (prices: Map<string, CryptoPrice>) => {
      await Promise.all(
        Array.from(prices.entries()).map(([symbol, price]) => cacheInstance.setPrice(symbol, price))
      );
    },

    /**
     * Get cached historical prices for a symbol and timeframe
     * T122: Historical data caching with 5 min TTL
     */
    getHistoricalPrices: async (symbol: string, timeframe: Timeframe) => {
      try {
        // Try Redis cache first
        const cacheKey = `history:${symbol}:${timeframe}`;
        const cached = await cache.get<PriceHistory[]>(cacheKey);

        if (cached) {
          logger.debug(`Cache hit for historical data ${symbol} ${timeframe}`);
          return cached;
        }

        // Try database cache using repository
        const dbCached = await repository.findHistoricalPrices(symbol, timeframe);

        if (dbCached.length > 0) {
          const history = dbCached.map(record => ({
            timestamp: record.timestamp,
            price: record.price.toNumber(),
            volume: record.volume.toNumber(),
          }));

          // Check if data is fresh (within last 5 minutes)
          const latestTimestamp = dbCached[dbCached.length - 1].timestamp;
          if (isHistoryFresh(latestTimestamp)) {
            // Restore to Redis cache
            await cache.set(cacheKey, history, HISTORY_CACHE_TTL);
            return history;
          }
        }

        return null;
      } catch (error) {
        logger.error(`Error getting cached historical data for ${symbol}:`, error);
        return null;
      }
    },

    /**
     * Set cached historical prices for a symbol and timeframe
     * T122: Historical data caching with 5 min TTL
     */
    setHistoricalPrices: async (
      symbol: string,
      timeframe: Timeframe,
      history: PriceHistory[]
    ) => {
      try {
        const cacheKey = `history:${symbol}:${timeframe}`;

        // Set in Redis cache
        await cache.set(cacheKey, history, HISTORY_CACHE_TTL);

        // Store in database for persistence using repository
        await repository.replaceHistoricalPrices(symbol, timeframe, history);

        logger.debug(`Cached historical data for ${symbol} ${timeframe}`);
      } catch (error) {
        logger.error(`Error caching historical data for ${symbol}:`, error);
      }
    },

    /**
     * Clear all cached prices
     */
    clearAll: async () => {
      try {
        await cache.clear('price:*');
        await cache.clear('history:*');
        logger.info('Cleared all price caches');
      } catch (error) {
        logger.error('Error clearing price caches:', error);
      }
    },
  };

  return cacheInstance;
};
