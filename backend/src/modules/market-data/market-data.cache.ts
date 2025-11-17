// T054: Market data caching using Redis with in-memory fallback
// T122: Enhanced with historical data caching (5 min TTL)

import { PrismaClient } from '@prisma/client';
import { CryptoPrice, PriceHistory, Timeframe } from './market-data.types';
import { logger } from '../../shared/services/logger.service';
import { CacheService } from '../../shared/services/cache.service';
import Decimal from 'decimal.js';

export class MarketDataCache {
  private readonly prisma: PrismaClient;
  private readonly cache: CacheService;
  private readonly CACHE_TTL = 60; // 60 seconds for current prices
  private readonly HISTORY_CACHE_TTL = 300; // 5 minutes for historical data
  private readonly DB_TTL = 120; // 2 minutes

  constructor(prisma: PrismaClient, cache: CacheService) {
    this.prisma = prisma;
    this.cache = cache;
  }

  /**
   * Get cached price for a symbol
   */
  async getPrice(symbol: string): Promise<CryptoPrice | null> {
    try {
      // Try Redis cache first
      const cacheKey = `price:${symbol}`;
      const cached = await this.cache.get<CryptoPrice>(cacheKey);

      if (cached) {
        logger.debug(`Cache hit for ${symbol}`);
        return cached;
      }

      // Try database cache
      const dbCached = await this.prisma.priceCache.findUnique({
        where: { symbol },
      });

      if (dbCached && this.isFresh(dbCached.lastUpdated)) {
        const price = this.dbToCryptoPrice(dbCached);
        // Restore to Redis cache
        await this.cache.set(cacheKey, price, this.CACHE_TTL);
        return price;
      }

      return null;
    } catch (error) {
      logger.error(`Error getting cached price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Set cached price for a symbol
   */
  async setPrice(symbol: string, price: CryptoPrice): Promise<void> {
    try {
      const cacheKey = `price:${symbol}`;

      // Set in Redis cache
      await this.cache.set(cacheKey, price, this.CACHE_TTL);

      // Update database cache
      await this.prisma.priceCache.upsert({
        where: { symbol },
        create: {
          symbol,
          name: price.name,
          price: new Decimal(price.price),
          change1h: new Decimal(price.change1h || 0),
          change24h: new Decimal(price.change24h),
          change7d: new Decimal(price.change7d || 0),
          change30d: new Decimal(price.change30d || 0),
          volume24h: new Decimal(price.volume24h),
          marketCap: new Decimal(price.marketCap),
          high24h: price.high24h ? new Decimal(price.high24h) : null,
          low24h: price.low24h ? new Decimal(price.low24h) : null,
          lastUpdated: price.lastUpdated,
        },
        update: {
          name: price.name,
          price: new Decimal(price.price),
          change1h: new Decimal(price.change1h || 0),
          change24h: new Decimal(price.change24h),
          change7d: new Decimal(price.change7d || 0),
          change30d: new Decimal(price.change30d || 0),
          volume24h: new Decimal(price.volume24h),
          marketCap: new Decimal(price.marketCap),
          high24h: price.high24h ? new Decimal(price.high24h) : null,
          low24h: price.low24h ? new Decimal(price.low24h) : null,
          lastUpdated: price.lastUpdated,
        },
      });

      logger.debug(`Cached price for ${symbol}`);
    } catch (error) {
      logger.error(`Error caching price for ${symbol}:`, error);
    }
  }

  /**
   * Get cached prices for multiple symbols
   */
  async getPrices(symbols: string[]): Promise<Map<string, CryptoPrice>> {
    const prices = new Map<string, CryptoPrice>();

    await Promise.all(
      symbols.map(async symbol => {
        const price = await this.getPrice(symbol);
        if (price) {
          prices.set(symbol, price);
        }
      })
    );

    return prices;
  }

  /**
   * Set cached prices for multiple symbols
   */
  async setPrices(prices: Map<string, CryptoPrice>): Promise<void> {
    await Promise.all(
      Array.from(prices.entries()).map(([symbol, price]) => this.setPrice(symbol, price))
    );
  }

  /**
   * Check if cached data is fresh (not stale)
   */
  private isFresh(lastUpdated: Date): boolean {
    const now = new Date();
    const age = now.getTime() - lastUpdated.getTime();
    return age < this.DB_TTL * 1000;
  }

  /**
   * Convert database PriceCache to CryptoPrice
   */
  private dbToCryptoPrice(dbPrice: {
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
  }): CryptoPrice {
    return {
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
    };
  }

  /**
   * Get cached historical prices for a symbol and timeframe
   * T122: Historical data caching with 5 min TTL
   */
  async getHistoricalPrices(symbol: string, timeframe: Timeframe): Promise<PriceHistory[] | null> {
    try {
      // Try Redis cache first
      const cacheKey = `history:${symbol}:${timeframe}`;
      const cached = await this.cache.get<PriceHistory[]>(cacheKey);

      if (cached) {
        logger.debug(`Cache hit for historical data ${symbol} ${timeframe}`);
        return cached;
      }

      // Try database cache
      const dbCached = await this.prisma.priceHistory.findMany({
        where: {
          symbol,
          timeframe,
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      if (dbCached.length > 0) {
        const history = dbCached.map(record => ({
          timestamp: record.timestamp,
          price: record.price.toNumber(),
          volume: record.volume.toNumber(),
        }));

        // Check if data is fresh (within last 5 minutes)
        const latestTimestamp = dbCached[dbCached.length - 1].timestamp;
        if (this.isHistoryFresh(latestTimestamp)) {
          // Restore to Redis cache
          await this.cache.set(cacheKey, history, this.HISTORY_CACHE_TTL);
          return history;
        }
      }

      return null;
    } catch (error) {
      logger.error(`Error getting cached historical data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Set cached historical prices for a symbol and timeframe
   * T122: Historical data caching with 5 min TTL
   */
  async setHistoricalPrices(
    symbol: string,
    timeframe: Timeframe,
    history: PriceHistory[]
  ): Promise<void> {
    try {
      const cacheKey = `history:${symbol}:${timeframe}`;

      // Set in Redis cache
      await this.cache.set(cacheKey, history, this.HISTORY_CACHE_TTL);

      // Store in database for persistence
      // First, delete old records for this symbol/timeframe
      await this.prisma.priceHistory.deleteMany({
        where: {
          symbol,
          timeframe,
        },
      });

      // Insert new records
      await this.prisma.priceHistory.createMany({
        data: history.map(record => ({
          symbol,
          timeframe,
          timestamp: record.timestamp,
          price: new Decimal(record.price),
          volume: new Decimal(record.volume),
        })),
      });

      logger.debug(`Cached historical data for ${symbol} ${timeframe}`);
    } catch (error) {
      logger.error(`Error caching historical data for ${symbol}:`, error);
    }
  }

  /**
   * Check if historical data is fresh (within 5 minutes)
   */
  private isHistoryFresh(latestTimestamp: Date): boolean {
    const now = new Date();
    const age = now.getTime() - latestTimestamp.getTime();
    return age < this.HISTORY_CACHE_TTL * 1000;
  }

  /**
   * Clear all cached prices
   */
  async clearAll(): Promise<void> {
    try {
      await this.cache.clear('price:*');
      await this.cache.clear('history:*');
      logger.info('Cleared all price caches');
    } catch (error) {
      logger.error('Error clearing price caches:', error);
    }
  }
}
