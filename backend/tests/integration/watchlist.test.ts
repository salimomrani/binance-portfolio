// T167: Watchlist integration tests
// Tests the complete watchlist flow including database operations

import { PrismaClient } from '@prisma/client';
import { createWatchlistRepository } from '../../src/modules/watchlist/watchlist.repository';
import { createWatchlistService } from '../../src/modules/watchlist/watchlist.service';
import { MarketDataService } from '../../src/modules/market-data/market-data.service';
import { CacheService } from '../../src/shared/services/cache.service';

describe('Watchlist Integration Tests', () => {
  let prisma: PrismaClient;
  let watchlistService: ReturnType<typeof createWatchlistService>;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize Prisma client
    prisma = new PrismaClient();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `watchlist-test-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
      },
    });
    testUserId = user.id;

    // Initialize services
    const cacheService = new CacheService();
    const marketDataService = new MarketDataService(
      {
        binanceApiKey: 'test-key',
        binanceSecretKey: 'test-secret',
        cacheTTL: 60,
        retryAttempts: 3,
        retryDelay: 1000,
      },
      prisma,
      cacheService
    );

    const watchlistRepo = createWatchlistRepository(prisma);
    watchlistService = createWatchlistService(watchlistRepo, marketDataService);
  });

  afterAll(async () => {
    // Cleanup: Delete test user and all related data
    await prisma.watchlistItem.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe('addToWatchlist', () => {
    it('should successfully add a cryptocurrency to watchlist', async () => {
      const result = await watchlistService.addToWatchlist(testUserId, {
        symbol: 'BTC',
        name: 'Bitcoin',
        notes: 'Test note',
      });

      expect(result).toBeDefined();
      expect(result.symbol).toBe('BTC');
      expect(result.name).toBe('Bitcoin');
      expect(result.notes).toBe('Test note');
      expect(result.userId).toBe(testUserId);
    });

    it('should prevent adding duplicate symbol', async () => {
      // Add first time
      await watchlistService.addToWatchlist(testUserId, {
        symbol: 'ETH',
        name: 'Ethereum',
      });

      // Try to add duplicate
      await expect(
        watchlistService.addToWatchlist(testUserId, {
          symbol: 'ETH',
          name: 'Ethereum',
        })
      ).rejects.toThrow('Symbol already in watchlist');
    });

    it('should convert symbol to uppercase', async () => {
      const result = await watchlistService.addToWatchlist(testUserId, {
        symbol: 'ada',
        name: 'Cardano',
      });

      expect(result.symbol).toBe('ADA');
    });
  });

  describe('getWatchlist', () => {
    beforeEach(async () => {
      // Clean up before each test
      await prisma.watchlistItem.deleteMany({
        where: { userId: testUserId },
      });
    });

    it('should return empty array when watchlist is empty', async () => {
      const result = await watchlistService.getWatchlist(testUserId);
      expect(result).toEqual([]);
    });

    it('should return watchlist items with market data', async () => {
      // Add items to watchlist
      await watchlistService.addToWatchlist(testUserId, {
        symbol: 'BTC',
        name: 'Bitcoin',
      });
      await watchlistService.addToWatchlist(testUserId, {
        symbol: 'ETH',
        name: 'Ethereum',
      });

      const result = await watchlistService.getWatchlist(testUserId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('symbol');
      expect(result[0]).toHaveProperty('currentPrice');
      expect(result[0]).toHaveProperty('change24h');
      expect(result[0]).toHaveProperty('trend');
    });

    it('should include notes in watchlist items', async () => {
      await watchlistService.addToWatchlist(testUserId, {
        symbol: 'DOT',
        name: 'Polkadot',
        notes: 'Promising project',
      });

      const result = await watchlistService.getWatchlist(testUserId);

      expect(result[0].notes).toBe('Promising project');
    });
  });

  describe('removeFromWatchlist', () => {
    it('should successfully remove item from watchlist', async () => {
      // Add item
      const added = await watchlistService.addToWatchlist(testUserId, {
        symbol: 'SOL',
        name: 'Solana',
      });

      // Remove item
      await watchlistService.removeFromWatchlist(testUserId, added.id);

      // Verify removal
      const watchlist = await watchlistService.getWatchlist(testUserId);
      expect(watchlist.find((item) => item.id === added.id)).toBeUndefined();
    });

    it('should throw error when removing non-existent item', async () => {
      await expect(
        watchlistService.removeFromWatchlist(testUserId, 'non-existent-id')
      ).rejects.toThrow('Watchlist item not found');
    });

    it('should prevent removing item from another user', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: `other-user-${Date.now()}@example.com`,
          passwordHash: 'test-hash',
        },
      });

      // Add item for other user
      const otherItem = await prisma.watchlistItem.create({
        data: {
          userId: otherUser.id,
          symbol: 'MATIC',
          name: 'Polygon',
        },
      });

      // Try to remove as test user
      await expect(
        watchlistService.removeFromWatchlist(testUserId, otherItem.id)
      ).rejects.toThrow('Unauthorized');

      // Cleanup
      await prisma.watchlistItem.delete({ where: { id: otherItem.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('isInWatchlist', () => {
    beforeEach(async () => {
      // Clean up before each test
      await prisma.watchlistItem.deleteMany({
        where: { userId: testUserId },
      });
    });

    it('should return true when symbol is in watchlist', async () => {
      await watchlistService.addToWatchlist(testUserId, {
        symbol: 'AVAX',
        name: 'Avalanche',
      });

      const result = await watchlistService.isInWatchlist(testUserId, 'AVAX');
      expect(result).toBe(true);
    });

    it('should return false when symbol is not in watchlist', async () => {
      const result = await watchlistService.isInWatchlist(testUserId, 'XRP');
      expect(result).toBe(false);
    });

    it('should be case-insensitive', async () => {
      await watchlistService.addToWatchlist(testUserId, {
        symbol: 'LINK',
        name: 'Chainlink',
      });

      const result = await watchlistService.isInWatchlist(testUserId, 'link');
      expect(result).toBe(true);
    });
  });
});
