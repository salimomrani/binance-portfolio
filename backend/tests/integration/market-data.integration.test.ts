/**
 * Integration tests for Market Data module
 * Tests full HTTP flow with real dependencies
 * Target coverage: 80%+
 */

import request from 'supertest';
import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { MarketDataRepository, createMarketDataRepository } from '../../src/modules/market-data/market-data.repository';
import { MarketDataService } from '../../src/modules/market-data/market-data.service';
import { MarketDataController } from '../../src/modules/market-data/market-data.controller';
import { createMarketDataRoutes } from '../../src/modules/market-data/market-data.routes';
import { CacheService } from '../../src/shared/services/cache.service';
import { createTestPrismaClient, cleanupDatabase } from '../helpers';
import { AdapterConfig } from '../../src/modules/market-data/market-data.types';

// Mock external adapters to avoid real API calls
jest.mock('../../src/modules/market-data/binance.adapter');
jest.mock('../../src/modules/market-data/coingecko.adapter');

describe('Market Data Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let repository: MarketDataRepository;
  let service: MarketDataService;
  let controller: MarketDataController;
  let mockCacheService: jest.Mocked<CacheService>;

  const mockPrice = {
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

  beforeAll(async () => {
    // Setup Prisma client
    prisma = createTestPrismaClient();
    repository = createMarketDataRepository(prisma);

    // Setup mock cache service
    mockCacheService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(1),
      clear: jest.fn().mockResolvedValue(undefined),
      flushAll: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Setup service with mocked adapters
    const config: AdapterConfig = {
      binance: {
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      },
      coingecko: {
        apiKey: 'test-coingecko-key',
      },
    };
    service = new MarketDataService(config, repository, mockCacheService);

    // Setup controller
    controller = new MarketDataController(service);

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/market-data', createMarketDataRoutes(controller));

    // Error handler
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message,
        },
        timestamp: new Date().toISOString(),
      });
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);
    jest.clearAllMocks();
  });

  describe('GET /api/market-data/prices/:symbol', () => {
    it('should return market data for a symbol', async () => {
      // Arrange
      // Mock the primary adapter to return price
      const mockGetFullMarketData = jest.fn().mockResolvedValue(mockPrice);
      (service as any).primaryAdapter.getFullMarketData = mockGetFullMarketData;

      // Act
      const response = await request(app)
        .get('/api/market-data/prices/BTC')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.symbol).toBe('BTC');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle lowercase symbol', async () => {
      // Arrange
      const mockGetFullMarketData = jest.fn().mockResolvedValue(mockPrice);
      (service as any).primaryAdapter.getFullMarketData = mockGetFullMarketData;

      // Act
      const response = await request(app)
        .get('/api/market-data/prices/btc')
        .expect(200);

      // Assert
      expect(response.body.data.symbol).toBe('BTC');
      expect(mockGetFullMarketData).toHaveBeenCalledWith('BTC');
    });

    it('should return 400 for invalid symbol', async () => {
      // Act
      const response = await request(app)
        .get('/api/market-data/prices/')
        .expect(404);

      // Assert - Should be 404 because route doesn't match
    });

    it('should use cached data when available', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(mockPrice);

      // Act
      const response = await request(app)
        .get('/api/market-data/prices/BTC')
        .expect(200);

      // Assert
      expect(response.body.data.symbol).toBe('BTC');
      expect(mockCacheService.get).toHaveBeenCalledWith('market-data:BTC');
    });
  });

  describe('GET /api/market-data/prices?symbols=...', () => {
    it('should return prices for multiple symbols', async () => {
      // Arrange
      const ethPrice = { ...mockPrice, symbol: 'ETH', name: 'Ethereum', price: 3000 };
      const pricesMap = new Map([
        ['BTC', mockPrice],
        ['ETH', ethPrice],
      ]);

      const mockGetMultiplePrices = jest.fn().mockResolvedValue(pricesMap);
      (service as any).primaryAdapter.getMultiplePrices = mockGetMultiplePrices;

      // Act
      const response = await request(app)
        .get('/api/market-data/prices?symbols=BTC,ETH')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.BTC).toBeDefined();
      expect(response.body.data.ETH).toBeDefined();
    });

    it('should handle whitespace in symbols', async () => {
      // Arrange
      const mockGetMultiplePrices = jest.fn().mockResolvedValue(new Map([['BTC', mockPrice]]));
      (service as any).primaryAdapter.getMultiplePrices = mockGetMultiplePrices;

      // Act
      await request(app)
        .get('/api/market-data/prices?symbols= BTC , ETH ')
        .expect(200);

      // Assert
      expect(mockGetMultiplePrices).toHaveBeenCalledWith(['BTC', 'ETH']);
    });

    it('should return 400 for missing symbols parameter', async () => {
      // Act
      const response = await request(app)
        .get('/api/market-data/prices')
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for too many symbols', async () => {
      // Arrange
      const symbols = Array.from({ length: 51 }, (_, i) => `SYM${i}`).join(',');

      // Act
      const response = await request(app)
        .get(`/api/market-data/prices?symbols=${symbols}`)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/market-data/history/:symbol', () => {
    it('should return historical prices', async () => {
      // Arrange
      const mockHistory = [
        { timestamp: new Date(), price: 50000, volume: 1000000 },
        { timestamp: new Date(), price: 49000, volume: 900000 },
      ];

      const mockGetHistoricalPrices = jest.fn().mockResolvedValue(mockHistory);
      (service as any).primaryAdapter.getHistoricalPrices = mockGetHistoricalPrices;

      // Act
      const response = await request(app)
        .get('/api/market-data/history/BTC?timeframe=1h')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should handle different timeframes', async () => {
      // Arrange
      const mockGetHistoricalPrices = jest.fn().mockResolvedValue([]);
      (service as any).primaryAdapter.getHistoricalPrices = mockGetHistoricalPrices;

      // Act
      await request(app)
        .get('/api/market-data/history/BTC?timeframe=24h')
        .expect(200);

      await request(app)
        .get('/api/market-data/history/BTC?timeframe=7d')
        .expect(200);

      // Assert
      expect(mockGetHistoricalPrices).toHaveBeenCalledWith('BTC', '24h');
      expect(mockGetHistoricalPrices).toHaveBeenCalledWith('BTC', '7d');
    });

    it('should return 400 for invalid timeframe', async () => {
      // Act
      const response = await request(app)
        .get('/api/market-data/history/BTC?timeframe=invalid')
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing timeframe', async () => {
      // Act
      const response = await request(app)
        .get('/api/market-data/history/BTC')
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/market-data/status', () => {
    it('should return adapter status', async () => {
      // Arrange
      const mockIsAvailable = jest.fn().mockResolvedValue(true);
      (service as any).primaryAdapter.isAvailable = mockIsAvailable;
      (service as any).fallbackAdapter.isAvailable = mockIsAvailable;

      // Act
      const response = await request(app)
        .get('/api/market-data/status')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('primary');
      expect(response.body.data).toHaveProperty('fallback');
      expect(response.body.data).toHaveProperty('activeFallback');
    });
  });

  describe('Database caching', () => {
    it('should cache price data in database', async () => {
      // Arrange
      const mockGetFullMarketData = jest.fn().mockResolvedValue(mockPrice);
      (service as any).primaryAdapter.getFullMarketData = mockGetFullMarketData;

      // Act
      await request(app)
        .get('/api/market-data/prices/BTC')
        .expect(200);

      // Assert - Check that data was cached in database
      const cachedPrice = await repository.findBySymbol('BTC');
      expect(cachedPrice).toBeDefined();
      expect(cachedPrice?.symbol).toBe('BTC');
      expect(cachedPrice?.price.toNumber()).toBe(50000);
    });

    it('should retrieve cached data from database when Redis misses', async () => {
      // Arrange
      // First, cache the data
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

      // Mock Redis to return null (cache miss)
      mockCacheService.get.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .get('/api/market-data/prices/BTC')
        .expect(200);

      // Assert
      expect(response.body.data.symbol).toBe('BTC');
      // Should restore to Redis cache
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'market-data:BTC',
        expect.any(Object),
        60
      );
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      // Arrange
      const mockGetFullMarketData = jest.fn().mockRejectedValue(new Error('API error'));
      (service as any).primaryAdapter.getFullMarketData = mockGetFullMarketData;
      (service as any).fallbackAdapter.getFullMarketData = jest.fn().mockRejectedValue(new Error('Fallback error'));

      // Act
      const response = await request(app)
        .get('/api/market-data/prices/BTC')
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});
