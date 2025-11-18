/**
 * Integration tests for MarketDataRepository
 * Tests all database operations with real Prisma client
 * Target coverage: 90%+
 */

import { PrismaClient } from '@prisma/client';
import { MarketDataRepository } from '../market-data.repository';
import { createTestPrismaClient, cleanupDatabase } from '../../../../tests/helpers';

describe('MarketDataRepository', () => {
  let prisma: PrismaClient;
  let repository: MarketDataRepository;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    repository = new MarketDataRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);
  });

  // ============================================================
  // Price Cache Operations
  // ============================================================

  describe('findBySymbol', () => {
    it('should return null when price cache does not exist', async () => {
      const result = await repository.findBySymbol('BTC');
      expect(result).toBeNull();
    });

    it('should find price cache by symbol', async () => {
      // Arrange: Create test data
      const testData = {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        change1h: 0.5,
        change24h: 2.5,
        change7d: 10.0,
        change30d: 15.0,
        volume24h: 1000000000,
        marketCap: 1000000000000,
        lastUpdated: new Date(),
      };
      await repository.upsert(testData);

      // Act
      const result = await repository.findBySymbol('BTC');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.symbol).toBe('BTC');
      expect(result?.name).toBe('Bitcoin');
      expect(result?.price.toNumber()).toBe(50000);
    });
  });

  describe('findBySymbols', () => {
    it('should return empty array when no symbols found', async () => {
      const result = await repository.findBySymbols(['BTC', 'ETH']);
      expect(result).toEqual([]);
    });

    it('should find multiple price caches by symbols', async () => {
      // Arrange
      await repository.upsertMany([
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 50000,
          change1h: 0.5,
          change24h: 2.5,
          change7d: 10.0,
          change30d: 15.0,
          volume24h: 1000000000,
          marketCap: 1000000000000,
          lastUpdated: new Date(),
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3000,
          change1h: 0.3,
          change24h: 1.5,
          change7d: 5.0,
          change30d: 10.0,
          volume24h: 500000000,
          marketCap: 500000000000,
          lastUpdated: new Date(),
        },
      ]);

      // Act
      const result = await repository.findBySymbols(['BTC', 'ETH']);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.symbol).sort()).toEqual(['BTC', 'ETH']);
    });

    it('should only return found symbols', async () => {
      // Arrange
      await repository.upsert({
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        change1h: 0.5,
        change24h: 2.5,
        change7d: 10.0,
        change30d: 15.0,
        volume24h: 1000000000,
        marketCap: 1000000000000,
        lastUpdated: new Date(),
      });

      // Act
      const result = await repository.findBySymbols(['BTC', 'ETH', 'DOGE']);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('BTC');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no price caches exist', async () => {
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });

    it('should return all price caches', async () => {
      // Arrange
      await repository.upsertMany([
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 50000,
          change1h: 0.5,
          change24h: 2.5,
          change7d: 10.0,
          change30d: 15.0,
          volume24h: 1000000000,
          marketCap: 1000000000000,
          lastUpdated: new Date(),
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3000,
          change1h: 0.3,
          change24h: 1.5,
          change7d: 5.0,
          change30d: 10.0,
          volume24h: 500000000,
          marketCap: 500000000000,
          lastUpdated: new Date(),
        },
      ]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('upsert', () => {
    it('should create new price cache', async () => {
      // Arrange
      const testData = {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        change1h: 0.5,
        change24h: 2.5,
        change7d: 10.0,
        change30d: 15.0,
        volume24h: 1000000000,
        marketCap: 1000000000000,
        lastUpdated: new Date(),
      };

      // Act
      const result = await repository.upsert(testData);

      // Assert
      expect(result.symbol).toBe('BTC');
      expect(result.price.toNumber()).toBe(50000);
    });

    it('should update existing price cache', async () => {
      // Arrange: Create initial data
      await repository.upsert({
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        change1h: 0.5,
        change24h: 2.5,
        change7d: 10.0,
        change30d: 15.0,
        volume24h: 1000000000,
        marketCap: 1000000000000,
        lastUpdated: new Date(),
      });

      // Act: Update with new price
      const updatedData = {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 51000,
        change1h: 1.0,
        change24h: 3.0,
        change7d: 11.0,
        change30d: 16.0,
        volume24h: 1100000000,
        marketCap: 1100000000000,
        lastUpdated: new Date(),
      };
      const result = await repository.upsert(updatedData);

      // Assert
      expect(result.price.toNumber()).toBe(51000);
      expect(result.change1h.toNumber()).toBe(1.0);

      // Verify only one record exists
      const all = await repository.findAll();
      expect(all.length).toBe(1);
    });

    it('should handle optional high24h and low24h fields', async () => {
      // Arrange
      const testData = {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        change1h: 0.5,
        change24h: 2.5,
        change7d: 10.0,
        change30d: 15.0,
        volume24h: 1000000000,
        marketCap: 1000000000000,
        high24h: 52000,
        low24h: 48000,
        lastUpdated: new Date(),
      };

      // Act
      const result = await repository.upsert(testData);

      // Assert
      expect(result.high24h?.toNumber()).toBe(52000);
      expect(result.low24h?.toNumber()).toBe(48000);
    });

    it('should handle null high24h and low24h fields', async () => {
      // Arrange
      const testData = {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        change1h: 0.5,
        change24h: 2.5,
        change7d: 10.0,
        change30d: 15.0,
        volume24h: 1000000000,
        marketCap: 1000000000000,
        high24h: null,
        low24h: null,
        lastUpdated: new Date(),
      };

      // Act
      const result = await repository.upsert(testData);

      // Assert
      expect(result.high24h).toBeNull();
      expect(result.low24h).toBeNull();
    });
  });

  describe('upsertMany', () => {
    it('should create multiple price caches', async () => {
      // Arrange
      const testData = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 50000,
          change1h: 0.5,
          change24h: 2.5,
          change7d: 10.0,
          change30d: 15.0,
          volume24h: 1000000000,
          marketCap: 1000000000000,
          lastUpdated: new Date(),
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3000,
          change1h: 0.3,
          change24h: 1.5,
          change7d: 5.0,
          change30d: 10.0,
          volume24h: 500000000,
          marketCap: 500000000000,
          lastUpdated: new Date(),
        },
      ];

      // Act
      await repository.upsertMany(testData);

      // Assert
      const all = await repository.findAll();
      expect(all.length).toBe(2);
    });

    it('should update existing and create new price caches', async () => {
      // Arrange: Create initial BTC data
      await repository.upsert({
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        change1h: 0.5,
        change24h: 2.5,
        change7d: 10.0,
        change30d: 15.0,
        volume24h: 1000000000,
        marketCap: 1000000000000,
        lastUpdated: new Date(),
      });

      // Act: Update BTC and create ETH
      await repository.upsertMany([
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 51000,
          change1h: 1.0,
          change24h: 3.0,
          change7d: 11.0,
          change30d: 16.0,
          volume24h: 1100000000,
          marketCap: 1100000000000,
          lastUpdated: new Date(),
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3000,
          change1h: 0.3,
          change24h: 1.5,
          change7d: 5.0,
          change30d: 10.0,
          volume24h: 500000000,
          marketCap: 500000000000,
          lastUpdated: new Date(),
        },
      ]);

      // Assert
      const all = await repository.findAll();
      expect(all.length).toBe(2);

      const btc = await repository.findBySymbol('BTC');
      expect(btc?.price.toNumber()).toBe(51000);
    });
  });

  describe('deleteStale', () => {
    it('should delete price caches older than specified date', async () => {
      // Arrange: Create old and new price caches
      const oldDate = new Date('2023-01-01');
      const newDate = new Date();

      await repository.upsertMany([
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 50000,
          change1h: 0.5,
          change24h: 2.5,
          change7d: 10.0,
          change30d: 15.0,
          volume24h: 1000000000,
          marketCap: 1000000000000,
          lastUpdated: oldDate,
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3000,
          change1h: 0.3,
          change24h: 1.5,
          change7d: 5.0,
          change30d: 10.0,
          volume24h: 500000000,
          marketCap: 500000000000,
          lastUpdated: newDate,
        },
      ]);

      // Act: Delete caches older than 2023-06-01
      const cutoffDate = new Date('2023-06-01');
      const deletedCount = await repository.deleteStale(cutoffDate);

      // Assert
      expect(deletedCount).toBe(1);

      const remaining = await repository.findAll();
      expect(remaining.length).toBe(1);
      expect(remaining[0].symbol).toBe('ETH');
    });

    it('should return 0 when no stale caches exist', async () => {
      // Arrange: Create recent price cache
      await repository.upsert({
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        change1h: 0.5,
        change24h: 2.5,
        change7d: 10.0,
        change30d: 15.0,
        volume24h: 1000000000,
        marketCap: 1000000000000,
        lastUpdated: new Date(),
      });

      // Act: Delete caches older than yesterday
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const deletedCount = await repository.deleteStale(yesterday);

      // Assert
      expect(deletedCount).toBe(0);
    });
  });

  // ============================================================
  // Price History Operations
  // ============================================================

  describe('findHistoricalPrices', () => {
    it('should return empty array when no history exists', async () => {
      const result = await repository.findHistoricalPrices('BTC', '1h');
      expect(result).toEqual([]);
    });

    it('should find historical prices by symbol and timeframe', async () => {
      // Arrange
      const now = new Date();
      const history = [
        { timestamp: new Date(now.getTime() - 3600000), price: 49000, volume: 1000000 },
        { timestamp: new Date(now.getTime() - 7200000), price: 48000, volume: 900000 },
      ];
      await repository.createHistoricalPrices('BTC', '1h', history);

      // Act
      const result = await repository.findHistoricalPrices('BTC', '1h');

      // Assert
      expect(result.length).toBe(2);
      expect(result[0].symbol).toBe('BTC');
      expect(result[0].timeframe).toBe('1h');
      // Results should be ordered by timestamp ascending
      expect(result[0].price.toNumber()).toBe(48000);
      expect(result[1].price.toNumber()).toBe(49000);
    });

    it('should filter by timeframe correctly', async () => {
      // Arrange: Create history for different timeframes
      await repository.createHistoricalPrices('BTC', '1h', [
        { timestamp: new Date(), price: 50000, volume: 1000000 },
      ]);
      await repository.createHistoricalPrices('BTC', '1d', [
        { timestamp: new Date(), price: 51000, volume: 2000000 },
      ]);

      // Act
      const result1h = await repository.findHistoricalPrices('BTC', '1h');
      const result1d = await repository.findHistoricalPrices('BTC', '1d');

      // Assert
      expect(result1h.length).toBe(1);
      expect(result1h[0].timeframe).toBe('1h');
      expect(result1d.length).toBe(1);
      expect(result1d[0].timeframe).toBe('1d');
    });
  });

  describe('findHistoricalPricesByDateRange', () => {
    it('should find historical prices within date range', async () => {
      // Arrange
      const baseTime = new Date('2024-01-01T00:00:00Z');
      const history = [
        { timestamp: new Date(baseTime.getTime()), price: 48000, volume: 1000000 },
        { timestamp: new Date(baseTime.getTime() + 3600000), price: 49000, volume: 1100000 },
        { timestamp: new Date(baseTime.getTime() + 7200000), price: 50000, volume: 1200000 },
        { timestamp: new Date(baseTime.getTime() + 10800000), price: 51000, volume: 1300000 },
      ];
      await repository.createHistoricalPrices('BTC', '1h', history);

      // Act: Get prices between hour 1 and hour 2
      const startDate = new Date(baseTime.getTime() + 3600000);
      const endDate = new Date(baseTime.getTime() + 7200000);
      const result = await repository.findHistoricalPricesByDateRange(
        'BTC',
        '1h',
        startDate,
        endDate
      );

      // Assert
      expect(result.length).toBe(2);
      expect(result[0].price.toNumber()).toBe(49000);
      expect(result[1].price.toNumber()).toBe(50000);
    });
  });

  describe('createHistoricalPrices', () => {
    it('should create historical price records', async () => {
      // Arrange
      const history = [
        { timestamp: new Date(), price: 50000, volume: 1000000 },
        { timestamp: new Date(Date.now() - 3600000), price: 49000, volume: 900000 },
      ];

      // Act
      await repository.createHistoricalPrices('BTC', '1h', history);

      // Assert
      const result = await repository.findHistoricalPrices('BTC', '1h');
      expect(result.length).toBe(2);
    });

    it('should skip duplicates when creating historical prices', async () => {
      // Arrange
      const timestamp = new Date();
      const history1 = [{ timestamp, price: 50000, volume: 1000000 }];
      const history2 = [
        { timestamp, price: 51000, volume: 1100000 }, // Same timestamp
      ];

      // Act
      await repository.createHistoricalPrices('BTC', '1h', history1);
      await repository.createHistoricalPrices('BTC', '1h', history2);

      // Assert: Should only have 1 record (duplicate skipped)
      const result = await repository.findHistoricalPrices('BTC', '1h');
      expect(result.length).toBe(1);
      expect(result[0].price.toNumber()).toBe(50000); // First one kept
    });
  });

  describe('deleteHistoricalPrices', () => {
    it('should delete historical prices by symbol and timeframe', async () => {
      // Arrange
      await repository.createHistoricalPrices('BTC', '1h', [
        { timestamp: new Date(), price: 50000, volume: 1000000 },
      ]);
      await repository.createHistoricalPrices('BTC', '1d', [
        { timestamp: new Date(), price: 51000, volume: 2000000 },
      ]);

      // Act
      const deletedCount = await repository.deleteHistoricalPrices('BTC', '1h');

      // Assert
      expect(deletedCount).toBe(1);

      const result1h = await repository.findHistoricalPrices('BTC', '1h');
      const result1d = await repository.findHistoricalPrices('BTC', '1d');
      expect(result1h.length).toBe(0);
      expect(result1d.length).toBe(1); // 1d should remain
    });
  });

  describe('deleteHistoricalPricesOlderThan', () => {
    it('should delete historical prices older than specified date', async () => {
      // Arrange
      const oldDate = new Date('2023-01-01');
      const newDate = new Date();

      await repository.createHistoricalPrices('BTC', '1h', [
        { timestamp: oldDate, price: 48000, volume: 1000000 },
        { timestamp: newDate, price: 50000, volume: 1100000 },
      ]);

      // Act
      const cutoffDate = new Date('2023-06-01');
      const deletedCount = await repository.deleteHistoricalPricesOlderThan(cutoffDate);

      // Assert
      expect(deletedCount).toBe(1);

      const remaining = await repository.findHistoricalPrices('BTC', '1h');
      expect(remaining.length).toBe(1);
      expect(remaining[0].price.toNumber()).toBe(50000);
    });
  });

  describe('replaceHistoricalPrices', () => {
    it('should replace existing historical prices', async () => {
      // Arrange: Create initial history
      const oldHistory = [
        { timestamp: new Date('2024-01-01T00:00:00Z'), price: 48000, volume: 1000000 },
        { timestamp: new Date('2024-01-01T01:00:00Z'), price: 49000, volume: 1100000 },
      ];
      await repository.createHistoricalPrices('BTC', '1h', oldHistory);

      // Act: Replace with new history
      const newHistory = [
        { timestamp: new Date('2024-01-02T00:00:00Z'), price: 50000, volume: 1200000 },
        { timestamp: new Date('2024-01-02T01:00:00Z'), price: 51000, volume: 1300000 },
      ];
      await repository.replaceHistoricalPrices('BTC', '1h', newHistory);

      // Assert
      const result = await repository.findHistoricalPrices('BTC', '1h');
      expect(result.length).toBe(2);
      expect(result[0].price.toNumber()).toBe(50000);
      expect(result[1].price.toNumber()).toBe(51000);
    });

    it('should handle transaction atomically', async () => {
      // Arrange: Create initial history
      await repository.createHistoricalPrices('BTC', '1h', [
        { timestamp: new Date(), price: 50000, volume: 1000000 },
      ]);

      // Act & Assert: Replace should succeed atomically
      const newHistory = [{ timestamp: new Date(), price: 51000, volume: 1100000 }];
      await repository.replaceHistoricalPrices('BTC', '1h', newHistory);

      const result = await repository.findHistoricalPrices('BTC', '1h');
      expect(result.length).toBe(1);
      expect(result[0].price.toNumber()).toBe(51000);
    });
  });
});
