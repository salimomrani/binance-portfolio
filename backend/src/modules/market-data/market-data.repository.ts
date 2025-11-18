// Market Data Repository - Data Access Layer
// Handles all Prisma database operations for market data

import { PrismaClient, PriceCache, PriceHistory, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import {
  CryptoPrice,
  CryptoMarketData,
  PriceHistory as PriceHistoryType,
  Timeframe,
} from './market-data.types';

/**
 * Market Data Repository Type
 */
export type MarketDataRepository = {
  findBySymbol: (symbol: string) => Promise<PriceCache | null>;
  findBySymbols: (symbols: string[]) => Promise<PriceCache[]>;
  findAll: () => Promise<PriceCache[]>;
  upsert: (data: {
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
  }) => Promise<PriceCache>;
  upsertMany: (
    prices: Array<{
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
    }>
  ) => Promise<void>;
  deleteStale: (olderThan: Date) => Promise<number>;
  findHistoricalPrices: (symbol: string, timeframe: Timeframe) => Promise<PriceHistory[]>;
  findHistoricalPricesByDateRange: (
    symbol: string,
    timeframe: Timeframe,
    startDate: Date,
    endDate: Date
  ) => Promise<PriceHistory[]>;
  createHistoricalPrices: (
    symbol: string,
    timeframe: Timeframe,
    history: Array<{ timestamp: Date; price: number; volume: number }>
  ) => Promise<void>;
  deleteHistoricalPrices: (symbol: string, timeframe: Timeframe) => Promise<number>;
  deleteHistoricalPricesOlderThan: (olderThan: Date) => Promise<number>;
  replaceHistoricalPrices: (
    symbol: string,
    timeframe: Timeframe,
    history: Array<{ timestamp: Date; price: number; volume: number }>
  ) => Promise<void>;
};

/**
 * Create Market Data Repository
 * Factory function for creating market data repository instance
 */
export const createMarketDataRepository = (prisma: PrismaClient): MarketDataRepository => ({
  // ============================================================
  // Price Cache Operations
  // ============================================================

  /**
   * Find cached price by symbol
   */
  findBySymbol: async (symbol: string) => {
    return prisma.priceCache.findUnique({
      where: { symbol },
    });
  },

  /**
   * Find multiple cached prices by symbols
   */
  findBySymbols: async (symbols: string[]) => {
    return prisma.priceCache.findMany({
      where: {
        symbol: {
          in: symbols,
        },
      },
    });
  },

  /**
   * Get all cached prices
   */
  findAll: async () => {
    return prisma.priceCache.findMany();
  },

  /**
   * Upsert price cache for a single symbol
   */
  upsert: async (data: {
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
  }) => {
    return prisma.priceCache.upsert({
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
  },

  /**
   * Upsert multiple price caches in a transaction
   */
  upsertMany: async (
    prices: Array<{
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
    }>
  ) => {
    await prisma.$transaction(
      prices.map((data) =>
        prisma.priceCache.upsert({
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
  },

  /**
   * Delete stale price cache entries older than specified date
   */
  deleteStale: async (olderThan: Date) => {
    const result = await prisma.priceCache.deleteMany({
      where: {
        lastUpdated: {
          lt: olderThan,
        },
      },
    });
    return result.count;
  },

  // ============================================================
  // Price History Operations
  // ============================================================

  /**
   * Find historical prices by symbol and timeframe
   */
  findHistoricalPrices: async (symbol: string, timeframe: Timeframe) => {
    return prisma.priceHistory.findMany({
      where: {
        symbol,
        timeframe,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
  },

  /**
   * Find historical prices by symbol, timeframe, and date range
   */
  findHistoricalPricesByDateRange: async (
    symbol: string,
    timeframe: Timeframe,
    startDate: Date,
    endDate: Date
  ) => {
    return prisma.priceHistory.findMany({
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
  },

  /**
   * Create historical price records in bulk
   */
  createHistoricalPrices: async (
    symbol: string,
    timeframe: Timeframe,
    history: Array<{ timestamp: Date; price: number; volume: number }>
  ) => {
    await prisma.priceHistory.createMany({
      data: history.map((record) => ({
        symbol,
        timeframe,
        timestamp: record.timestamp,
        price: new Decimal(record.price),
        volume: new Decimal(record.volume),
      })),
      skipDuplicates: true, // Skip if same symbol/timeframe/timestamp already exists
    });
  },

  /**
   * Delete historical prices by symbol and timeframe
   */
  deleteHistoricalPrices: async (symbol: string, timeframe: Timeframe) => {
    const result = await prisma.priceHistory.deleteMany({
      where: {
        symbol,
        timeframe,
      },
    });
    return result.count;
  },

  /**
   * Delete historical prices older than specified date
   */
  deleteHistoricalPricesOlderThan: async (olderThan: Date) => {
    const result = await prisma.priceHistory.deleteMany({
      where: {
        timestamp: {
          lt: olderThan,
        },
      },
    });
    return result.count;
  },

  /**
   * Replace historical prices for a symbol and timeframe
   * (Delete existing + Insert new in a transaction)
   */
  replaceHistoricalPrices: async (
    symbol: string,
    timeframe: Timeframe,
    history: Array<{ timestamp: Date; price: number; volume: number }>
  ) => {
    await prisma.$transaction(async (tx) => {
      // Delete old records
      await tx.priceHistory.deleteMany({
        where: {
          symbol,
          timeframe,
        },
      });

      // Insert new records
      await tx.priceHistory.createMany({
        data: history.map((record) => ({
          symbol,
          timeframe,
          timestamp: record.timestamp,
          price: new Decimal(record.price),
          volume: new Decimal(record.volume),
        })),
      });
    });
  },
});
