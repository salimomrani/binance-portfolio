import { PrismaClient, PriceCache, Prisma } from '@prisma/client';

/**
 * Market Data Repository Type
 *
 * Handles all database operations for market data (PriceCache).
 * Abstracts Prisma calls and provides clean interface for data access.
 */
export type MarketDataRepository = {
  findBySymbol: (symbol: string) => Promise<PriceCache | null>;
  findBySymbols: (symbols: string[]) => Promise<PriceCache[]>;
  findAll: (limit?: number) => Promise<PriceCache[]>;
  findTrending: (limit?: number) => Promise<PriceCache[]>;
  findTopLosers: (limit?: number) => Promise<PriceCache[]>;
  findByMarketCapRange: (minMarketCap: number, maxMarketCap: number, limit?: number) => Promise<PriceCache[]>;
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
    high24h?: number;
    low24h?: number;
    source?: string;
  }) => Promise<PriceCache>;
  upsertMany: (dataArray: Array<{
    symbol: string;
    name: string;
    price: number;
    change1h: number;
    change24h: number;
    change7d: number;
    change30d: number;
    volume24h: number;
    marketCap: number;
    high24h?: number;
    low24h?: number;
    source?: string;
  }>) => Promise<void>;
  deleteStale: (olderThan: Date) => Promise<number>;
  exists: (symbol: string) => Promise<boolean>;
  count: () => Promise<number>;
  getLastUpdated: (symbol: string) => Promise<Date | null>;
  search: (query: string, limit?: number) => Promise<PriceCache[]>;
  getMarketStats: () => Promise<{
    totalMarketCap: number;
    totalVolume24h: number;
    avgChange24h: number;
    cryptoCount: number;
  }>;
  findHistoricalPrices: (symbol: string, timeframe: string) => Promise<any[]>;
  replaceHistoricalPrices: (
    symbol: string,
    timeframe: string,
    history: Array<{
      timestamp: Date;
      price: number;
      volume: number;
    }>
  ) => Promise<void>;
  deleteAll: () => Promise<number>;
};

/**
 * Create Market Data Repository
 * Factory function that creates a repository instance with functional composition
 */
export const createMarketDataRepository = (prisma: PrismaClient): MarketDataRepository => ({
  /**
   * Find market data by symbol
   */
  findBySymbol: async (symbol: string) => {
    return prisma.priceCache.findUnique({
      where: { symbol: symbol.toUpperCase() }
    });
  },

  /**
   * Find market data for multiple symbols
   */
  findBySymbols: async (symbols: string[]) => {
    const upperSymbols = symbols.map(s => s.toUpperCase());

    return prisma.priceCache.findMany({
      where: {
        symbol: {
          in: upperSymbols
        }
      }
    });
  },

  /**
   * Find all market data entries
   * @param limit Optional limit on number of results
   */
  findAll: async (limit?: number) => {
    return prisma.priceCache.findMany({
      orderBy: {
        marketCap: 'desc' // Order by market cap (largest first)
      },
      take: limit
    });
  },

  /**
   * Find trending cryptos (highest 24h change)
   */
  findTrending: async (limit: number = 10) => {
    return prisma.priceCache.findMany({
      orderBy: {
        change24h: 'desc'
      },
      take: limit
    });
  },

  /**
   * Find top losers (lowest 24h change)
   */
  findTopLosers: async (limit: number = 10) => {
    return prisma.priceCache.findMany({
      orderBy: {
        change24h: 'asc'
      },
      take: limit
    });
  },

  /**
   * Find by market cap range
   */
  findByMarketCapRange: async (
    minMarketCap: number,
    maxMarketCap: number,
    limit?: number
  ) => {
    return prisma.priceCache.findMany({
      where: {
        marketCap: {
          gte: minMarketCap,
          lte: maxMarketCap
        }
      },
      orderBy: {
        marketCap: 'desc'
      },
      take: limit
    });
  },

  /**
   * Upsert (insert or update) a single market data entry
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
    high24h?: number;
    low24h?: number;
    source?: string;
  }) => {
    const symbol = data.symbol.toUpperCase();

    return prisma.priceCache.upsert({
      where: { symbol },
      create: {
        symbol,
        name: data.name,
        price: data.price,
        change1h: data.change1h,
        change24h: data.change24h,
        change7d: data.change7d,
        change30d: data.change30d,
        volume24h: data.volume24h,
        marketCap: data.marketCap,
        high24h: data.high24h,
        low24h: data.low24h,
        source: data.source || 'binance',
        lastUpdated: new Date()
      },
      update: {
        name: data.name,
        price: data.price,
        change1h: data.change1h,
        change24h: data.change24h,
        change7d: data.change7d,
        change30d: data.change30d,
        volume24h: data.volume24h,
        marketCap: data.marketCap,
        high24h: data.high24h,
        low24h: data.low24h,
        source: data.source || 'binance',
        lastUpdated: new Date()
      }
    });
  },

  /**
   * Upsert multiple market data entries in a transaction
   */
  upsertMany: async (
    dataArray: Array<{
      symbol: string;
      name: string;
      price: number;
      change1h: number;
      change24h: number;
      change7d: number;
      change30d: number;
      volume24h: number;
      marketCap: number;
      high24h?: number;
      low24h?: number;
      source?: string;
    }>
  ) => {
    await prisma.$transaction(
      dataArray.map(data => {
        const symbol = data.symbol.toUpperCase();

        return prisma.priceCache.upsert({
          where: { symbol },
          create: {
            symbol,
            name: data.name,
            price: data.price,
            change1h: data.change1h,
            change24h: data.change24h,
            change7d: data.change7d,
            change30d: data.change30d,
            volume24h: data.volume24h,
            marketCap: data.marketCap,
            high24h: data.high24h,
            low24h: data.low24h,
            source: data.source || 'binance',
            lastUpdated: new Date()
          },
          update: {
            name: data.name,
            price: data.price,
            change1h: data.change1h,
            change24h: data.change24h,
            change7d: data.change7d,
            change30d: data.change30d,
            volume24h: data.volume24h,
            marketCap: data.marketCap,
            high24h: data.high24h,
            low24h: data.low24h,
            source: data.source || 'binance',
            lastUpdated: new Date()
          }
        });
      })
    );
  },

  /**
   * Delete stale market data (older than specified date)
   * @returns Number of records deleted
   */
  deleteStale: async (olderThan: Date) => {
    const result = await prisma.priceCache.deleteMany({
      where: {
        lastUpdated: {
          lt: olderThan
        }
      }
    });

    return result.count;
  },

  /**
   * Check if market data exists for a symbol
   */
  exists: async (symbol: string) => {
    const count = await prisma.priceCache.count({
      where: { symbol: symbol.toUpperCase() }
    });

    return count > 0;
  },

  /**
   * Get count of all cached market data entries
   */
  count: async () => {
    return prisma.priceCache.count();
  },

  /**
   * Get the last update time for a symbol
   */
  getLastUpdated: async (symbol: string) => {
    const data = await prisma.priceCache.findUnique({
      where: { symbol: symbol.toUpperCase() },
      select: { lastUpdated: true }
    });

    return data?.lastUpdated || null;
  },

  /**
   * Search market data by name or symbol
   */
  search: async (query: string, limit: number = 10) => {
    const searchQuery = query.toUpperCase();

    return prisma.priceCache.findMany({
      where: {
        OR: [
          {
            symbol: {
              contains: searchQuery
            }
          },
          {
            name: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: {
        marketCap: 'desc'
      },
      take: limit
    });
  },

  /**
   * Get market statistics
   */
  getMarketStats: async () => {
    const result = await prisma.priceCache.aggregate({
      _sum: {
        marketCap: true,
        volume24h: true
      },
      _avg: {
        change24h: true
      },
      _count: true
    });

    return {
      totalMarketCap: Number(result._sum.marketCap) || 0,
      totalVolume24h: Number(result._sum.volume24h) || 0,
      avgChange24h: Number(result._avg.change24h) || 0,
      cryptoCount: result._count
    };
  },

  /**
   * Find historical prices for a symbol and timeframe
   */
  findHistoricalPrices: async (symbol: string, timeframe: string) => {
    return prisma.priceHistory.findMany({
      where: {
        symbol: symbol.toUpperCase(),
        timeframe
      },
      orderBy: {
        timestamp: 'asc'
      }
    });
  },

  /**
   * Replace historical prices for a symbol and timeframe
   * Deletes existing records and inserts new ones in a transaction
   */
  replaceHistoricalPrices: async (
    symbol: string,
    timeframe: string,
    history: Array<{
      timestamp: Date;
      price: number;
      volume: number;
    }>
  ) => {
    const upperSymbol = symbol.toUpperCase();

    await prisma.$transaction(async (tx) => {
      // Delete existing records
      await tx.priceHistory.deleteMany({
        where: {
          symbol: upperSymbol,
          timeframe
        }
      });

      // Insert new records
      if (history.length > 0) {
        await tx.priceHistory.createMany({
          data: history.map(h => ({
            symbol: upperSymbol,
            timeframe,
            timestamp: h.timestamp,
            price: h.price,
            volume: h.volume
          }))
        });
      }
    });
  },

  /**
   * Delete all market data (use with caution, mainly for testing)
   */
  deleteAll: async () => {
    const result = await prisma.priceCache.deleteMany();
    return result.count;
  }
});
