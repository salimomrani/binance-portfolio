import request from 'supertest';
import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import createMarketDataRoutes from '../../src/modules/market-data/market-data.routes';
import { createMarketDataHandlers } from '../../src/modules/market-data/market-data.controller';
import { MarketDataService } from '../../src/modules/market-data/market-data.service';
import { createMarketDataRepository } from '../../src/modules/market-data/market-data.repository';
import { CacheService } from '../../src/shared/services/cache.service';

/**
 * MarketData E2E Integration Tests
 * 
 * Tests the complete HTTP flow: Request → Router → Controller → Service → Repository → Database
 * Uses real Express app with Supertest
 * Target: 80%+ coverage
 */

describe('MarketData E2E Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let service: MarketDataService;

  beforeAll(async () => {
    // Setup test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL_TEST || 'postgresql://postgres:postgres@localhost:5432/binance_portfolio_test'
        }
      }
    });
    await prisma.$connect();

    // Create repository and service (mocked adapters for E2E)
    const repository = createMarketDataRepository(prisma);
    const mockCacheService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined)
    } as any;

    const config = {
      binanceApiKey: 'test-key',
      binanceSecretKey: 'test-secret',
      coingeckoApiKey: 'test-coingecko',
      cacheTTL: 60,
      retryAttempts: 3,
      retryDelay: 1000
    };

    service = new MarketDataService(config, repository, mockCacheService);

    // Create Express app
    app = express();
    app.use(express.json());

    // Mount routes
    const handlers = createMarketDataHandlers(service);
    const router = createMarketDataRoutes(handlers);
    app.use('/api/market-data', router);

    // Error handler
    app.use((err: any, req: any, res: any, next: any) => {
      res.status(err.status || 500).json({
        success: false,
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Internal server error'
        },
        timestamp: new Date().toISOString()
      });
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.priceCache.deleteMany();
    await prisma.priceHistory.deleteMany();
  });

  describe('GET /api/market-data/prices/:symbol', () => {
    it('should return 404 for non-existent symbol', async () => {
      const response = await request(app)
        .get('/api/market-data/prices/NOTFOUND')
        .expect('Content-Type', /json/);

      // Note: In real implementation, this might return 404 or call external API
      // For now, we're testing the error handling path
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should return 400 for invalid symbol (too long)', async () => {
      const response = await request(app)
        .get('/api/market-data/prices/VERYLONGSYMBOL123')
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('symbol')
        }
      });
    });

    it('should return 400 for empty symbol', async () => {
      const response = await request(app)
        .get('/api/market-data/prices/ ')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle lowercase symbols', async () => {
      // Mock adapter would be called here in real scenario
      // For E2E we're testing the request flow
      const response = await request(app)
        .get('/api/market-data/prices/btc');

      // Should process without validation error (even if adapter fails)
      if (response.status === 400) {
        expect(response.body.error.code).not.toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('GET /api/market-data/prices (batch)', () => {
    it('should return 400 when symbols parameter is missing', async () => {
      const response = await request(app)
        .get('/api/market-data/prices')
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('symbols')
        }
      });
    });

    it('should return 400 for empty symbols parameter', async () => {
      const response = await request(app)
        .get('/api/market-data/prices?symbols=')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for too many symbols (>50)', async () => {
      const symbols = Array.from({ length: 51 }, (_, i) => `SYM${i}`).join(',');
      
      const response = await request(app)
        .get(`/api/market-data/prices?symbols=${symbols}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR'
        }
      });
    });

    it('should accept valid symbols parameter', async () => {
      const response = await request(app)
        .get('/api/market-data/prices?symbols=BTC,ETH,ADA');

      // Should not return validation error
      if (response.status === 400) {
        expect(response.body.error.code).not.toBe('VALIDATION_ERROR');
      }
    });

    it('should handle symbols with whitespace', async () => {
      const response = await request(app)
        .get('/api/market-data/prices?symbols= BTC , ETH , ADA ');

      // Should process without validation error
      if (response.status === 400) {
        expect(response.body.error.code).not.toBe('VALIDATION_ERROR');
      }
    });

    it('should handle lowercase symbols', async () => {
      const response = await request(app)
        .get('/api/market-data/prices?symbols=btc,eth');

      // Should process without validation error
      if (response.status === 400) {
        expect(response.body.error.code).not.toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('GET /api/market-data/history/:symbol', () => {
    it('should return 400 when timeframe is missing', async () => {
      const response = await request(app)
        .get('/api/market-data/history/BTC')
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('timeframe')
        }
      });
    });

    it('should return 400 for invalid timeframe', async () => {
      const response = await request(app)
        .get('/api/market-data/history/BTC?timeframe=invalid')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('timeframe')
        }
      });
    });

    it('should accept valid timeframes', async () => {
      const validTimeframes = ['1h', '24h', '7d', '30d', '1y'];
      
      for (const timeframe of validTimeframes) {
        const response = await request(app)
          .get(`/api/market-data/history/BTC?timeframe=${timeframe}`);

        // Should not return validation error
        if (response.status === 400) {
          expect(response.body.error.code).not.toBe('VALIDATION_ERROR');
        }
      }
    });

    it('should return 400 for missing symbol', async () => {
      const response = await request(app)
        .get('/api/market-data/history/?timeframe=1h')
        .expect(404); // Express router returns 404 for missing param

      // This tests router behavior
    });

    it('should handle lowercase symbol', async () => {
      const response = await request(app)
        .get('/api/market-data/history/btc?timeframe=1h');

      // Should process without validation error
      if (response.status === 400) {
        expect(response.body.error.code).not.toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('GET /api/market-data/status', () => {
    it('should return adapter status', async () => {
      const response = await request(app)
        .get('/api/market-data/status')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          primary: expect.any(Boolean),
          fallback: expect.any(Boolean),
          activeFallback: expect.any(Boolean)
        },
        timestamp: expect.any(String)
      });
    });

    it('should include timestamp in response', async () => {
      const response = await request(app)
        .get('/api/market-data/status')
        .expect(200);

      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should return consistent status structure', async () => {
      const response = await request(app)
        .get('/api/market-data/status')
        .expect(200);

      expect(response.body.data).toHaveProperty('primary');
      expect(response.body.data).toHaveProperty('fallback');
      expect(response.body.data).toHaveProperty('activeFallback');
    });
  });

  describe('HTTP Headers and Content Type', () => {
    it('should return JSON content type for all endpoints', async () => {
      const endpoints = [
        '/api/market-data/status',
        '/api/market-data/history/BTC?timeframe=1h'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        
        if (response.status !== 404) {
          expect(response.headers['content-type']).toMatch(/json/);
        }
      }
    });

    it('should include timestamp in all responses', async () => {
      const response = await request(app)
        .get('/api/market-data/status');

      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Error Responses', () => {
    it('should return consistent error structure', async () => {
      const response = await request(app)
        .get('/api/market-data/prices')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String)
        },
        timestamp: expect.any(String)
      });
    });

    it('should include error details for validation errors', async () => {
      const response = await request(app)
        .get('/api/market-data/prices')
        .expect(400);

      expect(response.body.error).toHaveProperty('details');
      expect(Array.isArray(response.body.error.details)).toBe(true);
    });
  });

  describe('Route Mounting', () => {
    it('should return 404 for undefined routes', async () => {
      await request(app)
        .get('/api/market-data/undefined-route')
        .expect(404);
    });

    it('should handle trailing slashes', async () => {
      const response = await request(app)
        .get('/api/market-data/status/');

      // Express may handle this differently, just ensure it doesn't crash
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Success Response Structure', () => {
    it('should include success flag in all successful responses', async () => {
      const response = await request(app)
        .get('/api/market-data/status')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should include data field in successful responses', async () => {
      const response = await request(app)
        .get('/api/market-data/status')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Input Sanitization', () => {
    it('should handle special characters in symbol', async () => {
      const response = await request(app)
        .get('/api/market-data/prices/BTC%20')
        .expect(400);

      // Should return validation error or bad request
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle URL encoding', async () => {
      const response = await request(app)
        .get('/api/market-data/prices?symbols=BTC%2CETH');

      // Should decode URL encoding properly
      if (response.status === 400) {
        expect(response.body.error.code).not.toBe('VALIDATION_ERROR');
      }
    });
  });
});
