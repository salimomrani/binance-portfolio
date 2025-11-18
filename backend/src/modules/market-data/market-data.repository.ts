// Market Data Repository - Data Access Layer
// Handles all Prisma database operations for market data

import { PrismaClient, PriceCache, PriceHistory, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { CryptoPrice, CryptoMarketData, PriceHistory as PriceHistoryType, Timeframe } from './market-data.types';

export class MarketDataRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ============================================================
  // Price Cache Operations
  // ============================================================

  /**
   * Find cached price by symbol
   */
  async findBySymbol(symbol: string): Promise<PriceCache | null> {
    return this.prisma.priceCache.findUnique({
      where: { symbol },
    });
  }

  /**
   * Find multiple cached prices by symbols
   */
  async findBySymbols(symbols: string[]): Promise<PriceCache[]> {
    return this.prisma.priceCache.findMany({
      where: {
        symbol: {
          in: symbols,
        },
      },
    });
  }

  /**
   * Get all cached prices
   */
  async findAll(): Promise<PriceCache[]> {
    return this.prisma.priceCache.findMany();
  }

  /**
   * Upsert price cache for a single symbol
   */
  async upsert(data: {
    symbol: string;
    name: string;
    price: number;
    change1h: number;
    change24h: number;
    change7d: number;
    change30d: number;
    volume24h: number;
    marketCap: number;
    high24h?: number | null;
    low24h?: number | null;
    lastUpdated: Date;
  }): Promise<PriceCache> {
    return this.prisma.priceCache.upsert({
      where: { symbol: data.symbol },
      create: {
        symbol: data.symbol,
        name: data.name,
        price: new Decimal(data.price),
        change1h: new Decimal(data.change1h),
        change24h: new Decimal(data.change24h),
        change7d: new Decimal(data.change7d),
        change30d: new Decimal(data.change30d),
        volume24h: new Decimal(data.volume24h),
        marketCap: new Decimal(data.marketCap),
        high24h: data.high24h ? new Decimal(data.high24h) : null,
        low24h: data.low24h ? new Decimal(data.low24h) : null,
        lastUpdated: data.lastUpdated,
      },
      update: {
        name: data.name,
        price: new Decimal(data.price),
        change1h: new Decimal(data.change1h),
        change24h: new Decimal(data.change24h),
        change7d: new Decimal(data.change7d),
        change30d: new Decimal(data.change30d),
        volume24h: new Decimal(data.volume24h),
        marketCap: new Decimal(data.marketCap),
        high24h: data.high24h ? new Decimal(data.high24h) : null,
        low24h: data.low24h ? new Decimal(data.low24h) : null,
        lastUpdated: data.lastUpdated,
      },
    });
  }

  /**
   * Upsert multiple price caches in a transaction
   */
  async upsertMany(prices: Array<{
    symbol: string;
    name: string;
    price: number;
    change1h: number;
    change24h: number;
    change7d: number;
    change30d: number;
    volume24h: number;
    marketCap: number;
    high24h?: number | null;
    low24h?: number | null;
    lastUpdated: Date;
  }>): Promise<void> {
    await this.prisma.$transaction(
      prices.map(data =>
        this.prisma.priceCache.upsert({
          where: { symbol: data.symbol },
          create: {
            symbol: data.symbol,
            name: data.name,
            price: new Decimal(data.price),
            change1h: new Decimal(data.change1h),
            change24h: new Decimal(data.change24h),
            change7d: new Decimal(data.change7d),
            change30d: new Decimal(data.change30d),
            volume24h: new Decimal(data.volume24h),
            marketCap: new Decimal(data.marketCap),
            high24h: data.high24h ? new Decimal(data.high24h) : null,
            low24h: data.low24h ? new Decimal(data.low24h) : null,
            lastUpdated: data.lastUpdated,
          },
          update: {
            name: data.name,
            price: new Decimal(data.price),
            change1h: new Decimal(data.change1h),
            change24h: new Decimal(data.change24h),
            change7d: new Decimal(data.change7d),
            change30d: new Decimal(data.change30d),
            volume24h: new Decimal(data.volume24h),
            marketCap: new Decimal(data.marketCap),
            high24h: data.high24h ? new Decimal(data.high24h) : null,
            low24h: data.low24h ? new Decimal(data.low24h) : null,
            lastUpdated: data.lastUpdated,
          },
        })
      )
    );
  }

  /**
   * Delete stale price cache entries older than specified date
   */
  async deleteStale(olderThan: Date): Promise<number> {
    const result = await this.prisma.priceCache.deleteMany({
      where: {
        lastUpdated: {
          lt: olderThan,
        },
      },
    });
    return result.count;
  }

  // ============================================================
  // Price History Operations
  // ============================================================

  /**
   * Find historical prices by symbol and timeframe
   */
  async findHistoricalPrices(symbol: string, timeframe: Timeframe): Promise<PriceHistory[]> {
    return this.prisma.priceHistory.findMany({
      where: {
        symbol,
        timeframe,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
  }

  /**
   * Find historical prices by symbol, timeframe, and date range
   */
  async findHistoricalPricesByDateRange(
    symbol: string,
    timeframe: Timeframe,
    startDate: Date,
    endDate: Date
  ): Promise<PriceHistory[]> {
    return this.prisma.priceHistory.findMany({
      where: {
        symbol,
        timeframe,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
  }

  /**
   * Create historical price records in bulk
   */
  async createHistoricalPrices(
    symbol: string,
    timeframe: Timeframe,
    history: Array<{ timestamp: Date; price: number; volume: number }>
  ): Promise<void> {
    await this.prisma.priceHistory.createMany({
      data: history.map(record => ({
        symbol,
        timeframe,
        timestamp: record.timestamp,
        price: new Decimal(record.price),
        volume: new Decimal(record.volume),
      })),
      skipDuplicates: true, // Skip if same symbol/timeframe/timestamp already exists
    });
  }

  /**
   * Delete historical prices by symbol and timeframe
   */
  async deleteHistoricalPrices(symbol: string, timeframe: Timeframe): Promise<number> {
    const result = await this.prisma.priceHistory.deleteMany({
      where: {
        symbol,
        timeframe,
      },
    });
    return result.count;
  }

  /**
   * Delete historical prices older than specified date
   */
  async deleteHistoricalPricesOlderThan(olderThan: Date): Promise<number> {
    const result = await this.prisma.priceHistory.deleteMany({
      where: {
        timestamp: {
          lt: olderThan,
        },
      },
    });
    return result.count;
  }

  /**
   * Replace historical prices for a symbol and timeframe
   * (Delete existing + Insert new in a transaction)
   */
  async replaceHistoricalPrices(
    symbol: string,
    timeframe: Timeframe,
    history: Array<{ timestamp: Date; price: number; volume: number }>
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Delete old records
      await tx.priceHistory.deleteMany({
        where: {
          symbol,
          timeframe,
        },
      });

      // Insert new records
      await tx.priceHistory.createMany({
        data: history.map(record => ({
          symbol,
          timeframe,
          timestamp: record.timestamp,
          price: new Decimal(record.price),
          volume: new Decimal(record.volume),
        })),
      });
    });
  }
}
