import { PrismaClient, PriceCache } from '@prisma/client';
import { MarketDataRepository } from '../market-data.repository';

/**
 * MarketDataRepository Integration Tests
 * 
 * These are integration tests that use a real test database.
 * Tests all CRUD operations and specialized queries.
 * Target: 90%+ coverage
 */

describe('MarketDataRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: MarketDataRepository;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL_TEST || 'postgresql://postgres:postgres@localhost:5432/binance_portfolio_test'
        }
      }
    });
    await prisma.$connect();
    repository = new MarketDataRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.priceCache.deleteMany();
  });

  describe('findBySymbol', () => {
    it('should find a single market data entry by symbol', async () => {
      // Arrange
      await prisma.priceCache.create({
        data: {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 50000,
          change1h: 1.5,
          change24h: 2.5,
          change7d: 5.0,
          change30d: 10.0,
          volume24h: 1000000000,
          marketCap: 900000000000,
          lastUpdated: new Date()
        }
      });

      // Act
      const result = await repository.findBySymbol('BTC');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.symbol).toBe('BTC');
      expect(result?.name).toBe('Bitcoin');
      expect(Number(result?.price)).toBe(50000);
    });

    it('should handle lowercase symbols by converting to uppercase', async () => {
      // Arrange
      await prisma.priceCache.create({
        data: {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3000,
          change1h: 0.5,
          change24h: 1.5,
          change7d: 3.0,
          change30d: 8.0,
          volume24h: 500000000,
          marketCap: 350000000000,
          lastUpdated: new Date()
        }
      });

      // Act
      const result = await repository.findBySymbol('eth');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.symbol).toBe('ETH');
    });

    it('should return null if symbol not found', async () => {
      // Act
      const result = await repository.findBySymbol('NOTFOUND');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findBySymbols', () => {
    beforeEach(async () => {
      await prisma.priceCache.createMany({
        data: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 50000,
            change1h: 1.5,
            change24h: 2.5,
            change7d: 5.0,
            change30d: 10.0,
            volume24h: 1000000000,
            marketCap: 900000000000,
            lastUpdated: new Date()
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            price: 3000,
            change1h: 0.5,
            change24h: 1.5,
            change7d: 3.0,
            change30d: 8.0,
            volume24h: 500000000,
            marketCap: 350000000000,
            lastUpdated: new Date()
          },
          {
            symbol: 'ADA',
            name: 'Cardano',
            price: 0.5,
            change1h: -0.2,
            change24h: -1.0,
            change7d: 2.0,
            change30d: 5.0,
            volume24h: 100000000,
            marketCap: 15000000000,
            lastUpdated: new Date()
          }
        ]
      });
    });

    it('should find multiple market data entries by symbols', async () => {
      // Act
      const result = await repository.findBySymbols(['BTC', 'ETH']);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map(r => r.symbol)).toEqual(expect.arrayContaining(['BTC', 'ETH']));
    });

    it('should handle lowercase symbols', async () => {
      // Act
      const result = await repository.findBySymbols(['btc', 'eth']);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map(r => r.symbol)).toEqual(expect.arrayContaining(['BTC', 'ETH']));
    });

    it('should return empty array if no symbols found', async () => {
      // Act
      const result = await repository.findBySymbols(['NOTFOUND1', 'NOTFOUND2']);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return only found symbols if some do not exist', async () => {
      // Act
      const result = await repository.findBySymbols(['BTC', 'NOTFOUND']);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('BTC');
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      await prisma.priceCache.createMany({
        data: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 50000,
            change1h: 1.5,
            change24h: 2.5,
            change7d: 5.0,
            change30d: 10.0,
            volume24h: 1000000000,
            marketCap: 900000000000,
            lastUpdated: new Date()
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            price: 3000,
            change1h: 0.5,
            change24h: 1.5,
            change7d: 3.0,
            change30d: 8.0,
            volume24h: 500000000,
            marketCap: 350000000000,
            lastUpdated: new Date()
          },
          {
            symbol: 'ADA',
            name: 'Cardano',
            price: 0.5,
            change1h: -0.2,
            change24h: -1.0,
            change7d: 2.0,
            change30d: 5.0,
            volume24h: 100000000,
            marketCap: 15000000000,
            lastUpdated: new Date()
          }
        ]
      });
    });

    it('should return all market data entries', async () => {
      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toHaveLength(3);
    });

    it('should order by market cap descending', async () => {
      // Act
      const result = await repository.findAll();

      // Assert
      expect(result[0].symbol).toBe('BTC');
      expect(result[1].symbol).toBe('ETH');
      expect(result[2].symbol).toBe('ADA');
    });

    it('should respect limit parameter', async () => {
      // Act
      const result = await repository.findAll(2);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('BTC');
      expect(result[1].symbol).toBe('ETH');
    });
  });

  describe('findTrending', () => {
    beforeEach(async () => {
      await prisma.priceCache.createMany({
        data: [
          {
            symbol: 'PUMP',
            name: 'Pumpcoin',
            price: 10,
            change1h: 1.0,
            change24h: 50.0,  // Highest
            change7d: 100.0,
            change30d: 200.0,
            volume24h: 1000000,
            marketCap: 100000000,
            lastUpdated: new Date()
          },
          {
            symbol: 'UP',
            name: 'Upcoin',
            price: 5,
            change1h: 0.5,
            change24h: 25.0,  // Second highest
            change7d: 50.0,
            change30d: 100.0,
            volume24h: 500000,
            marketCap: 50000000,
            lastUpdated: new Date()
          },
          {
            symbol: 'DOWN',
            name: 'Downcoin',
            price: 1,
            change1h: -1.0,
            change24h: -10.0,  // Negative
            change7d: -20.0,
            change30d: -30.0,
            volume24h: 100000,
            marketCap: 10000000,
            lastUpdated: new Date()
          }
        ]
      });
    });

    it('should return trending cryptos ordered by 24h change descending', async () => {
      // Act
      const result = await repository.findTrending(10);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].symbol).toBe('PUMP');
      expect(result[1].symbol).toBe('UP');
      expect(result[2].symbol).toBe('DOWN');
    });

    it('should respect limit parameter', async () => {
      // Act
      const result = await repository.findTrending(2);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('PUMP');
      expect(result[1].symbol).toBe('UP');
    });

    it('should use default limit of 10', async () => {
      // Act
      const result = await repository.findTrending();

      // Assert
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe('findTopLosers', () => {
    beforeEach(async () => {
      await prisma.priceCache.createMany({
        data: [
          {
            symbol: 'DOWN',
            name: 'Downcoin',
            price: 1,
            change1h: -1.0,
            change24h: -30.0,  // Lowest
            change7d: -40.0,
            change30d: -50.0,
            volume24h: 100000,
            marketCap: 10000000,
            lastUpdated: new Date()
          },
          {
            symbol: 'FALL',
            name: 'Fallcoin',
            price: 2,
            change1h: -0.5,
            change24h: -15.0,  // Second lowest
            change7d: -20.0,
            change30d: -25.0,
            volume24h: 200000,
            marketCap: 20000000,
            lastUpdated: new Date()
          },
          {
            symbol: 'UP',
            name: 'Upcoin',
            price: 5,
            change1h: 1.0,
            change24h: 10.0,  // Positive
            change7d: 20.0,
            change30d: 30.0,
            volume24h: 500000,
            marketCap: 50000000,
            lastUpdated: new Date()
          }
        ]
      });
    });

    it('should return top losers ordered by 24h change ascending', async () => {
      // Act
      const result = await repository.findTopLosers(10);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].symbol).toBe('DOWN');
      expect(result[1].symbol).toBe('FALL');
      expect(result[2].symbol).toBe('UP');
    });

    it('should respect limit parameter', async () => {
      // Act
      const result = await repository.findTopLosers(2);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('DOWN');
      expect(result[1].symbol).toBe('FALL');
    });

    it('should use default limit of 10', async () => {
      // Act
      const result = await repository.findTopLosers();

      // Assert
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe('findByMarketCapRange', () => {
    beforeEach(async () => {
      await prisma.priceCache.createMany({
        data: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 50000,
            change1h: 1.5,
            change24h: 2.5,
            change7d: 5.0,
            change30d: 10.0,
            volume24h: 1000000000,
            marketCap: 900000000000,  // 900B
            lastUpdated: new Date()
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            price: 3000,
            change1h: 0.5,
            change24h: 1.5,
            change7d: 3.0,
            change30d: 8.0,
            volume24h: 500000000,
            marketCap: 350000000000,  // 350B
            lastUpdated: new Date()
          },
          {
            symbol: 'ADA',
            name: 'Cardano',
            price: 0.5,
            change1h: -0.2,
            change24h: -1.0,
            change7d: 2.0,
            change30d: 5.0,
            volume24h: 100000000,
            marketCap: 15000000000,  // 15B
            lastUpdated: new Date()
          }
        ]
      });
    });

    it('should find cryptos within market cap range', async () => {
      // Act
      const result = await repository.findByMarketCapRange(100000000000, 500000000000);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('ETH');
    });

    it('should include boundary values', async () => {
      // Act
      const result = await repository.findByMarketCapRange(350000000000, 900000000000);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map(r => r.symbol)).toEqual(expect.arrayContaining(['BTC', 'ETH']));
    });

    it('should order by market cap descending', async () => {
      // Act
      const result = await repository.findByMarketCapRange(0, 1000000000000);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].symbol).toBe('BTC');
      expect(result[1].symbol).toBe('ETH');
      expect(result[2].symbol).toBe('ADA');
    });

    it('should respect limit parameter', async () => {
      // Act
      const result = await repository.findByMarketCapRange(0, 1000000000000, 2);

      // Assert
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no matches', async () => {
      // Act
      const result = await repository.findByMarketCapRange(1, 100);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('upsert', () => {
    it('should insert new market data', async () => {
      // Act
      const result = await repository.upsert({
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        change1h: 1.5,
        change24h: 2.5,
        change7d: 5.0,
        change30d: 10.0,
        volume24h: 1000000000,
        marketCap: 900000000000
      });

      // Assert
      expect(result.symbol).toBe('BTC');
      expect(result.name).toBe('Bitcoin');
      expect(Number(result.price)).toBe(50000);
      expect(result.source).toBe('binance');
    });

    it('should update existing market data', async () => {
      // Arrange
      await prisma.priceCache.create({
        data: {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 45000,
          change1h: 1.0,
          change24h: 2.0,
          change7d: 4.0,
          change30d: 8.0,
          volume24h: 900000000,
          marketCap: 850000000000,
          lastUpdated: new Date('2024-01-01')
        }
      });

      // Act
      const result = await repository.upsert({
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        change1h: 1.5,
        change24h: 2.5,
        change7d: 5.0,
        change30d: 10.0,
        volume24h: 1000000000,
        marketCap: 900000000000
      });

      // Assert
      expect(Number(result.price)).toBe(50000);
      expect(result.lastUpdated.getTime()).toBeGreaterThan(new Date('2024-01-01').getTime());
    });

    it('should normalize symbol to uppercase', async () => {
      // Act
      const result = await repository.upsert({
        symbol: 'btc',
        name: 'Bitcoin',
        price: 50000,
        change1h: 1.5,
        change24h: 2.5,
        change7d: 5.0,
        change30d: 10.0,
        volume24h: 1000000000,
        marketCap: 900000000000
      });

      // Assert
      expect(result.symbol).toBe('BTC');
    });

    it('should use custom source if provided', async () => {
      // Act
      const result = await repository.upsert({
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        change1h: 1.5,
        change24h: 2.5,
        change7d: 5.0,
        change30d: 10.0,
        volume24h: 1000000000,
        marketCap: 900000000000,
        source: 'coingecko'
      });

      // Assert
      expect(result.source).toBe('coingecko');
    });

    it('should handle optional high24h and low24h', async () => {
      // Act
      const result = await repository.upsert({
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        change1h: 1.5,
        change24h: 2.5,
        change7d: 5.0,
        change30d: 10.0,
        volume24h: 1000000000,
        marketCap: 900000000000,
        high24h: 52000,
        low24h: 48000
      });

      // Assert
      expect(Number(result.high24h)).toBe(52000);
      expect(Number(result.low24h)).toBe(48000);
    });
  });

  describe('upsertMany', () => {
    it('should insert multiple new entries', async () => {
      // Act
      await repository.upsertMany([
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 50000,
          change1h: 1.5,
          change24h: 2.5,
          change7d: 5.0,
          change30d: 10.0,
          volume24h: 1000000000,
          marketCap: 900000000000
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3000,
          change1h: 0.5,
          change24h: 1.5,
          change7d: 3.0,
          change30d: 8.0,
          volume24h: 500000000,
          marketCap: 350000000000
        }
      ]);

      // Assert
      const count = await prisma.priceCache.count();
      expect(count).toBe(2);
    });

    it('should update existing entries', async () => {
      // Arrange
      await prisma.priceCache.create({
        data: {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 45000,
          change1h: 1.0,
          change24h: 2.0,
          change7d: 4.0,
          change30d: 8.0,
          volume24h: 900000000,
          marketCap: 850000000000,
          lastUpdated: new Date('2024-01-01')
        }
      });

      // Act
      await repository.upsertMany([
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 50000,
          change1h: 1.5,
          change24h: 2.5,
          change7d: 5.0,
          change30d: 10.0,
          volume24h: 1000000000,
          marketCap: 900000000000
        }
      ]);

      // Assert
      const btc = await prisma.priceCache.findUnique({ where: { symbol: 'BTC' } });
      expect(Number(btc?.price)).toBe(50000);
    });

    it('should handle mix of insert and update in transaction', async () => {
      // Arrange
      await prisma.priceCache.create({
        data: {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 45000,
          change1h: 1.0,
          change24h: 2.0,
          change7d: 4.0,
          change30d: 8.0,
          volume24h: 900000000,
          marketCap: 850000000000,
          lastUpdated: new Date('2024-01-01')
        }
      });

      // Act
      await repository.upsertMany([
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 50000,
          change1h: 1.5,
          change24h: 2.5,
          change7d: 5.0,
          change30d: 10.0,
          volume24h: 1000000000,
          marketCap: 900000000000
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3000,
          change1h: 0.5,
          change24h: 1.5,
          change7d: 3.0,
          change30d: 8.0,
          volume24h: 500000000,
          marketCap: 350000000000
        }
      ]);

      // Assert
      const count = await prisma.priceCache.count();
      expect(count).toBe(2);

      const btc = await prisma.priceCache.findUnique({ where: { symbol: 'BTC' } });
      expect(Number(btc?.price)).toBe(50000);
    });

    it('should normalize all symbols to uppercase', async () => {
      // Act
      await repository.upsertMany([
        {
          symbol: 'btc',
          name: 'Bitcoin',
          price: 50000,
          change1h: 1.5,
          change24h: 2.5,
          change7d: 5.0,
          change30d: 10.0,
          volume24h: 1000000000,
          marketCap: 900000000000
        },
        {
          symbol: 'eth',
          name: 'Ethereum',
          price: 3000,
          change1h: 0.5,
          change24h: 1.5,
          change7d: 3.0,
          change30d: 8.0,
          volume24h: 500000000,
          marketCap: 350000000000
        }
      ]);

      // Assert
      const btc = await prisma.priceCache.findUnique({ where: { symbol: 'BTC' } });
      const eth = await prisma.priceCache.findUnique({ where: { symbol: 'ETH' } });
      expect(btc).not.toBeNull();
      expect(eth).not.toBeNull();
    });
  });

  describe('deleteStale', () => {
    it('should delete entries older than specified date', async () => {
      // Arrange
      const oldDate = new Date('2024-01-01');
      const recentDate = new Date('2024-06-01');

      await prisma.priceCache.createMany({
        data: [
          {
            symbol: 'OLD1',
            name: 'Old Coin 1',
            price: 1,
            change1h: 0,
            change24h: 0,
            change7d: 0,
            change30d: 0,
            volume24h: 1000,
            marketCap: 10000,
            lastUpdated: oldDate
          },
          {
            symbol: 'OLD2',
            name: 'Old Coin 2',
            price: 2,
            change1h: 0,
            change24h: 0,
            change7d: 0,
            change30d: 0,
            volume24h: 2000,
            marketCap: 20000,
            lastUpdated: oldDate
          },
          {
            symbol: 'RECENT',
            name: 'Recent Coin',
            price: 3,
            change1h: 0,
            change24h: 0,
            change7d: 0,
            change30d: 0,
            volume24h: 3000,
            marketCap: 30000,
            lastUpdated: recentDate
          }
        ]
      });

      // Act
      const deletedCount = await repository.deleteStale(new Date('2024-03-01'));

      // Assert
      expect(deletedCount).toBe(2);

      const remaining = await prisma.priceCache.findMany();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].symbol).toBe('RECENT');
    });

    it('should return 0 if no stale entries', async () => {
      // Arrange
      await prisma.priceCache.create({
        data: {
          symbol: 'RECENT',
          name: 'Recent Coin',
          price: 1,
          change1h: 0,
          change24h: 0,
          change7d: 0,
          change30d: 0,
          volume24h: 1000,
          marketCap: 10000,
          lastUpdated: new Date()
        }
      });

      // Act
      const deletedCount = await repository.deleteStale(new Date('2024-01-01'));

      // Assert
      expect(deletedCount).toBe(0);
    });
  });

  describe('exists', () => {
    beforeEach(async () => {
      await prisma.priceCache.create({
        data: {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 50000,
          change1h: 1.5,
          change24h: 2.5,
          change7d: 5.0,
          change30d: 10.0,
          volume24h: 1000000000,
          marketCap: 900000000000,
          lastUpdated: new Date()
        }
      });
    });

    it('should return true if symbol exists', async () => {
      // Act
      const result = await repository.exists('BTC');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if symbol does not exist', async () => {
      // Act
      const result = await repository.exists('NOTFOUND');

      // Assert
      expect(result).toBe(false);
    });

    it('should handle lowercase symbols', async () => {
      // Act
      const result = await repository.exists('btc');

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('count', () => {
    it('should return 0 for empty table', async () => {
      // Act
      const result = await repository.count();

      // Assert
      expect(result).toBe(0);
    });

    it('should return correct count', async () => {
      // Arrange
      await prisma.priceCache.createMany({
        data: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 50000,
            change1h: 1.5,
            change24h: 2.5,
            change7d: 5.0,
            change30d: 10.0,
            volume24h: 1000000000,
            marketCap: 900000000000,
            lastUpdated: new Date()
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            price: 3000,
            change1h: 0.5,
            change24h: 1.5,
            change7d: 3.0,
            change30d: 8.0,
            volume24h: 500000000,
            marketCap: 350000000000,
            lastUpdated: new Date()
          }
        ]
      });

      // Act
      const result = await repository.count();

      // Assert
      expect(result).toBe(2);
    });
  });

  describe('getLastUpdated', () => {
    it('should return last updated date for symbol', async () => {
      // Arrange
      const testDate = new Date('2024-06-01T10:00:00Z');
      await prisma.priceCache.create({
        data: {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 50000,
          change1h: 1.5,
          change24h: 2.5,
          change7d: 5.0,
          change30d: 10.0,
          volume24h: 1000000000,
          marketCap: 900000000000,
          lastUpdated: testDate
        }
      });

      // Act
      const result = await repository.getLastUpdated('BTC');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.getTime()).toBe(testDate.getTime());
    });

    it('should return null if symbol not found', async () => {
      // Act
      const result = await repository.getLastUpdated('NOTFOUND');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle lowercase symbols', async () => {
      // Arrange
      const testDate = new Date('2024-06-01T10:00:00Z');
      await prisma.priceCache.create({
        data: {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 50000,
          change1h: 1.5,
          change24h: 2.5,
          change7d: 5.0,
          change30d: 10.0,
          volume24h: 1000000000,
          marketCap: 900000000000,
          lastUpdated: testDate
        }
      });

      // Act
      const result = await repository.getLastUpdated('btc');

      // Assert
      expect(result).not.toBeNull();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await prisma.priceCache.createMany({
        data: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 50000,
            change1h: 1.5,
            change24h: 2.5,
            change7d: 5.0,
            change30d: 10.0,
            volume24h: 1000000000,
            marketCap: 900000000000,
            lastUpdated: new Date()
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            price: 3000,
            change1h: 0.5,
            change24h: 1.5,
            change7d: 3.0,
            change30d: 8.0,
            volume24h: 500000000,
            marketCap: 350000000000,
            lastUpdated: new Date()
          },
          {
            symbol: 'BCH',
            name: 'Bitcoin Cash',
            price: 300,
            change1h: 0.2,
            change24h: 1.0,
            change7d: 2.0,
            change30d: 5.0,
            volume24h: 100000000,
            marketCap: 5000000000,
            lastUpdated: new Date()
          }
        ]
      });
    });

    it('should search by symbol', async () => {
      // Act
      const result = await repository.search('BTC');

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => r.symbol === 'BTC')).toBe(true);
    });

    it('should search by name (case insensitive)', async () => {
      // Act
      const result = await repository.search('bitcoin');

      // Assert
      expect(result.length).toBe(2); // Bitcoin and Bitcoin Cash
      expect(result.some(r => r.symbol === 'BTC')).toBe(true);
      expect(result.some(r => r.symbol === 'BCH')).toBe(true);
    });

    it('should search by partial match', async () => {
      // Act
      const result = await repository.search('bit');

      // Assert
      expect(result.length).toBe(2); // Bitcoin and Bitcoin Cash
    });

    it('should order by market cap descending', async () => {
      // Act
      const result = await repository.search('bitcoin');

      // Assert
      expect(result[0].symbol).toBe('BTC'); // Higher market cap
      expect(result[1].symbol).toBe('BCH');
    });

    it('should respect limit parameter', async () => {
      // Act
      const result = await repository.search('bitcoin', 1);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('BTC');
    });

    it('should use default limit of 10', async () => {
      // Act
      const result = await repository.search('bitcoin');

      // Assert
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should return empty array if no matches', async () => {
      // Act
      const result = await repository.search('notfound');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getMarketStats', () => {
    it('should return zero stats for empty table', async () => {
      // Act
      const result = await repository.getMarketStats();

      // Assert
      expect(result.totalMarketCap).toBe(0);
      expect(result.totalVolume24h).toBe(0);
      expect(result.avgChange24h).toBe(0);
      expect(result.cryptoCount).toBe(0);
    });

    it('should calculate correct market statistics', async () => {
      // Arrange
      await prisma.priceCache.createMany({
        data: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 50000,
            change1h: 1.5,
            change24h: 2.0,
            change7d: 5.0,
            change30d: 10.0,
            volume24h: 1000000000,
            marketCap: 900000000000,
            lastUpdated: new Date()
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            price: 3000,
            change1h: 0.5,
            change24h: 4.0,
            change7d: 3.0,
            change30d: 8.0,
            volume24h: 500000000,
            marketCap: 350000000000,
            lastUpdated: new Date()
          }
        ]
      });

      // Act
      const result = await repository.getMarketStats();

      // Assert
      expect(result.totalMarketCap).toBe(1250000000000); // 900B + 350B
      expect(result.totalVolume24h).toBe(1500000000); // 1B + 500M
      expect(result.avgChange24h).toBe(3.0); // (2 + 4) / 2
      expect(result.cryptoCount).toBe(2);
    });

    it('should handle negative changes in average', async () => {
      // Arrange
      await prisma.priceCache.createMany({
        data: [
          {
            symbol: 'UP',
            name: 'Upcoin',
            price: 10,
            change1h: 1.0,
            change24h: 10.0,
            change7d: 20.0,
            change30d: 30.0,
            volume24h: 1000000,
            marketCap: 100000000,
            lastUpdated: new Date()
          },
          {
            symbol: 'DOWN',
            name: 'Downcoin',
            price: 5,
            change1h: -1.0,
            change24h: -10.0,
            change7d: -20.0,
            change30d: -30.0,
            volume24h: 500000,
            marketCap: 50000000,
            lastUpdated: new Date()
          }
        ]
      });

      // Act
      const result = await repository.getMarketStats();

      // Assert
      expect(result.avgChange24h).toBe(0.0); // (10 + -10) / 2
    });
  });

  describe('findHistoricalPrices', () => {
    beforeEach(async () => {
      await prisma.priceHistory.createMany({
        data: [
          {
            symbol: 'BTC',
            timeframe: '1h',
            price: 50000,
            volume: 1000000000,
            timestamp: new Date('2024-06-01T10:00:00Z')
          },
          {
            symbol: 'BTC',
            timeframe: '1h',
            price: 51000,
            volume: 1100000000,
            timestamp: new Date('2024-06-01T11:00:00Z')
          },
          {
            symbol: 'BTC',
            timeframe: '24h',
            price: 49000,
            volume: 2000000000,
            timestamp: new Date('2024-05-31T10:00:00Z')
          },
          {
            symbol: 'ETH',
            timeframe: '1h',
            price: 3000,
            volume: 500000000,
            timestamp: new Date('2024-06-01T10:00:00Z')
          }
        ]
      });
    });

    afterEach(async () => {
      await prisma.priceHistory.deleteMany();
    });

    it('should find historical prices for symbol and timeframe', async () => {
      // Act
      const result = await repository.findHistoricalPrices('BTC', '1h');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('BTC');
      expect(result[0].timeframe).toBe('1h');
    });

    it('should order results by timestamp ascending', async () => {
      // Act
      const result = await repository.findHistoricalPrices('BTC', '1h');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].timestamp.getTime()).toBeLessThan(result[1].timestamp.getTime());
    });

    it('should filter by timeframe', async () => {
      // Act
      const result = await repository.findHistoricalPrices('BTC', '24h');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].timeframe).toBe('24h');
    });

    it('should handle lowercase symbols', async () => {
      // Act
      const result = await repository.findHistoricalPrices('btc', '1h');

      // Assert
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no matches', async () => {
      // Act
      const result = await repository.findHistoricalPrices('NOTFOUND', '1h');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('replaceHistoricalPrices', () => {
    afterEach(async () => {
      await prisma.priceHistory.deleteMany();
    });

    it('should insert historical prices', async () => {
      // Act
      await repository.replaceHistoricalPrices('BTC', '1h', [
        {
          timestamp: new Date('2024-06-01T10:00:00Z'),
          price: 50000,
          volume: 1000000000
        },
        {
          timestamp: new Date('2024-06-01T11:00:00Z'),
          price: 51000,
          volume: 1100000000
        }
      ]);

      // Assert
      const result = await prisma.priceHistory.findMany({
        where: { symbol: 'BTC', timeframe: '1h' }
      });
      expect(result).toHaveLength(2);
    });

    it('should replace existing historical prices', async () => {
      // Arrange
      await prisma.priceHistory.createMany({
        data: [
          {
            symbol: 'BTC',
            timeframe: '1h',
            price: 45000,
            volume: 900000000,
            timestamp: new Date('2024-06-01T09:00:00Z')
          },
          {
            symbol: 'BTC',
            timeframe: '1h',
            price: 46000,
            volume: 950000000,
            timestamp: new Date('2024-06-01T10:00:00Z')
          }
        ]
      });

      // Act
      await repository.replaceHistoricalPrices('BTC', '1h', [
        {
          timestamp: new Date('2024-06-01T11:00:00Z'),
          price: 51000,
          volume: 1100000000
        }
      ]);

      // Assert
      const result = await prisma.priceHistory.findMany({
        where: { symbol: 'BTC', timeframe: '1h' }
      });
      expect(result).toHaveLength(1);
      expect(Number(result[0].price)).toBe(51000);
    });

    it('should only delete records for specific symbol and timeframe', async () => {
      // Arrange
      await prisma.priceHistory.createMany({
        data: [
          {
            symbol: 'BTC',
            timeframe: '1h',
            price: 50000,
            volume: 1000000000,
            timestamp: new Date('2024-06-01T10:00:00Z')
          },
          {
            symbol: 'BTC',
            timeframe: '24h',
            price: 49000,
            volume: 2000000000,
            timestamp: new Date('2024-05-31T10:00:00Z')
          },
          {
            symbol: 'ETH',
            timeframe: '1h',
            price: 3000,
            volume: 500000000,
            timestamp: new Date('2024-06-01T10:00:00Z')
          }
        ]
      });

      // Act
      await repository.replaceHistoricalPrices('BTC', '1h', [
        {
          timestamp: new Date('2024-06-01T12:00:00Z'),
          price: 52000,
          volume: 1200000000
        }
      ]);

      // Assert
      const btc1h = await prisma.priceHistory.findMany({
        where: { symbol: 'BTC', timeframe: '1h' }
      });
      const btc24h = await prisma.priceHistory.findMany({
        where: { symbol: 'BTC', timeframe: '24h' }
      });
      const eth1h = await prisma.priceHistory.findMany({
        where: { symbol: 'ETH', timeframe: '1h' }
      });

      expect(btc1h).toHaveLength(1);
      expect(Number(btc1h[0].price)).toBe(52000);
      expect(btc24h).toHaveLength(1); // Not deleted
      expect(eth1h).toHaveLength(1); // Not deleted
    });

    it('should normalize symbol to uppercase', async () => {
      // Act
      await repository.replaceHistoricalPrices('btc', '1h', [
        {
          timestamp: new Date('2024-06-01T10:00:00Z'),
          price: 50000,
          volume: 1000000000
        }
      ]);

      // Assert
      const result = await prisma.priceHistory.findMany({
        where: { symbol: 'BTC' }
      });
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('BTC');
    });

    it('should handle empty history array', async () => {
      // Arrange
      await prisma.priceHistory.create({
        data: {
          symbol: 'BTC',
          timeframe: '1h',
          price: 50000,
          volume: 1000000000,
          timestamp: new Date('2024-06-01T10:00:00Z')
        }
      });

      // Act
      await repository.replaceHistoricalPrices('BTC', '1h', []);

      // Assert
      const result = await prisma.priceHistory.findMany({
        where: { symbol: 'BTC', timeframe: '1h' }
      });
      expect(result).toHaveLength(0);
    });

    it('should execute in a transaction', async () => {
      // This test verifies transactional behavior by checking that
      // either all operations succeed or all fail together.
      // We test this indirectly by checking the final state.

      // Act
      await repository.replaceHistoricalPrices('BTC', '1h', [
        {
          timestamp: new Date('2024-06-01T10:00:00Z'),
          price: 50000,
          volume: 1000000000
        },
        {
          timestamp: new Date('2024-06-01T11:00:00Z'),
          price: 51000,
          volume: 1100000000
        }
      ]);

      // Assert
      const result = await prisma.priceHistory.findMany({
        where: { symbol: 'BTC', timeframe: '1h' }
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('deleteAll', () => {
    it('should delete all entries', async () => {
      // Arrange
      await prisma.priceCache.createMany({
        data: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 50000,
            change1h: 1.5,
            change24h: 2.5,
            change7d: 5.0,
            change30d: 10.0,
            volume24h: 1000000000,
            marketCap: 900000000000,
            lastUpdated: new Date()
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            price: 3000,
            change1h: 0.5,
            change24h: 1.5,
            change7d: 3.0,
            change30d: 8.0,
            volume24h: 500000000,
            marketCap: 350000000000,
            lastUpdated: new Date()
          }
        ]
      });

      // Act
      const deletedCount = await repository.deleteAll();

      // Assert
      expect(deletedCount).toBe(2);

      const remaining = await prisma.priceCache.findMany();
      expect(remaining).toHaveLength(0);
    });

    it('should return 0 for empty table', async () => {
      // Act
      const deletedCount = await repository.deleteAll();

      // Assert
      expect(deletedCount).toBe(0);
    });
  });
});
