/**
 * Unit tests for MarketDataService
 * Tests business logic with mocked dependencies
 * Target coverage: 95%+
 */

import { MarketDataService } from '../market-data.service';
import { MarketDataRepository } from '../market-data.repository';
import { CacheService } from '../../../shared/services/cache.service';
import { AdapterConfig, CryptoPrice, CryptoMarketData, PriceHistory } from '../market-data.types';

// Mock dependencies
jest.mock('../binance.adapter');
jest.mock('../coingecko.adapter');
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('../../../shared/utils/retry.util', () => ({
  retry: jest.fn((fn) => fn()),
}));

describe('MarketDataService', () => {
  let service: MarketDataService;
  let mockRepository: jest.Mocked<MarketDataRepository>;
  let mockCacheService: jest.Mocked<CacheService>;
  let config: AdapterConfig;

  const mockPrice: CryptoPrice = {
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

  const mockMarketData: CryptoMarketData = {
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

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock repository
    mockRepository = {
      findBySymbol: jest.fn(),
      findBySymbols: jest.fn(),
      findAll: jest.fn(),
      upsert: jest.fn(),
      upsertMany: jest.fn(),
      deleteStale: jest.fn(),
      findHistoricalPrices: jest.fn(),
      findHistoricalPricesByDateRange: jest.fn(),
      createHistoricalPrices: jest.fn(),
      deleteHistoricalPrices: jest.fn(),
      deleteHistoricalPricesOlderThan: jest.fn(),
      replaceHistoricalPrices: jest.fn(),
    } as any;

    // Create mock cache service
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      del: jest.fn(),
      flushAll: jest.fn(),
    } as any;

    // Create adapter config
    config = {
      binance: {
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      },
      coingecko: {
        apiKey: 'test-coingecko-key',
      },
    };

    // Create service instance
    service = new MarketDataService(config, mockRepository, mockCacheService);
  });

  describe('getCurrentPrice', () => {
    it('should return cached price from Redis', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(mockPrice);

      // Act
      const result = await service.getCurrentPrice('BTC');

      // Assert
      expect(result).toEqual(mockPrice);
      expect(mockCacheService.get).toHaveBeenCalledWith('price:BTC');
      expect(mockRepository.findBySymbol).not.toHaveBeenCalled();
    });

    it('should return cached price from database when Redis cache misses', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      const dbPrice = {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: { toNumber: () => 50000 },
        change1h: { toNumber: () => 0.5 },
        change24h: { toNumber: () => 2.5 },
        change7d: { toNumber: () => 10.0 },
        change30d: { toNumber: () => 15.0 },
        volume24h: { toNumber: () => 1000000000 },
        marketCap: { toNumber: () => 1000000000000 },
        high24h: { toNumber: () => 52000 },
        low24h: { toNumber: () => 48000 },
        lastUpdated: new Date(),
      };
      mockRepository.findBySymbol.mockResolvedValue(dbPrice as any);

      // Act
      const result = await service.getCurrentPrice('BTC');

      // Assert
      expect(result.price).toBe(50000);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should fetch from primary adapter when cache misses', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findBySymbol.mockResolvedValue(null);

      // Mock primary adapter
      const mockGetCurrentPrice = jest.fn().mockResolvedValue(mockPrice);
      (service as any).primaryAdapter.getCurrentPrice = mockGetCurrentPrice;

      // Act
      const result = await service.getCurrentPrice('BTC');

      // Assert
      expect(result).toEqual(mockPrice);
      expect(mockGetCurrentPrice).toHaveBeenCalledWith('BTC');
      expect(mockCacheService.set).toHaveBeenCalledWith('price:BTC', mockPrice, 60);
      expect(mockRepository.upsert).toHaveBeenCalled();
    });

    it('should fallback to CoinGecko when Binance fails', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findBySymbol.mockResolvedValue(null);

      // Mock primary adapter to fail
      const mockPrimaryGetPrice = jest.fn().mockRejectedValue(new Error('Binance API error'));
      (service as any).primaryAdapter.getCurrentPrice = mockPrimaryGetPrice;

      // Mock fallback adapter to succeed
      const mockFallbackGetPrice = jest.fn().mockResolvedValue(mockPrice);
      (service as any).fallbackAdapter.getCurrentPrice = mockFallbackGetPrice;

      // Act
      const result = await service.getCurrentPrice('BTC');

      // Assert
      expect(result).toEqual(mockPrice);
      expect(mockFallbackGetPrice).toHaveBeenCalledWith('BTC');
    });

    it('should throw error when both adapters fail', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findBySymbol.mockResolvedValue(null);

      // Mock both adapters to fail
      const mockPrimaryGetPrice = jest.fn().mockRejectedValue(new Error('Binance error'));
      const mockFallbackGetPrice = jest.fn().mockRejectedValue(new Error('CoinGecko error'));
      (service as any).primaryAdapter.getCurrentPrice = mockPrimaryGetPrice;
      (service as any).fallbackAdapter.getCurrentPrice = mockFallbackGetPrice;

      // Act & Assert
      await expect(service.getCurrentPrice('BTC')).rejects.toThrow('Unable to fetch price for BTC');
    });
  });

  describe('getFullMarketData', () => {
    it('should return cached market data from Redis', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(mockMarketData);

      // Act
      const result = await service.getFullMarketData('BTC');

      // Assert
      expect(result).toEqual(mockMarketData);
      expect(mockCacheService.get).toHaveBeenCalledWith('market-data:BTC');
    });

    it('should fetch from primary adapter when cache misses', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findBySymbol.mockResolvedValue(null);

      // Mock primary adapter
      const mockGetFullMarketData = jest.fn().mockResolvedValue(mockMarketData);
      (service as any).primaryAdapter.getFullMarketData = mockGetFullMarketData;

      // Act
      const result = await service.getFullMarketData('BTC');

      // Assert
      expect(result).toEqual(mockMarketData);
      expect(mockGetFullMarketData).toHaveBeenCalledWith('BTC');
      expect(mockCacheService.set).toHaveBeenCalledWith('market-data:BTC', mockMarketData, 60);
    });

    it('should fallback to CoinGecko when Binance fails', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findBySymbol.mockResolvedValue(null);

      // Mock primary adapter to fail
      const mockPrimaryGetData = jest.fn().mockRejectedValue(new Error('Binance error'));
      (service as any).primaryAdapter.getFullMarketData = mockPrimaryGetData;

      // Mock fallback adapter to succeed
      const mockFallbackGetData = jest.fn().mockResolvedValue(mockMarketData);
      (service as any).fallbackAdapter.getFullMarketData = mockFallbackGetData;

      // Act
      const result = await service.getFullMarketData('BTC');

      // Assert
      expect(result).toEqual(mockMarketData);
      expect(mockFallbackGetData).toHaveBeenCalledWith('BTC');
    });
  });

  describe('getMultiplePrices', () => {
    it('should return all cached prices from Redis', async () => {
      // Arrange
      const symbols = ['BTC', 'ETH'];
      mockCacheService.get
        .mockResolvedValueOnce(mockPrice)
        .mockResolvedValueOnce({ ...mockPrice, symbol: 'ETH', name: 'Ethereum', price: 3000 });

      // Act
      const result = await service.getMultiplePrices(symbols);

      // Assert
      expect(result.size).toBe(2);
      expect(result.get('BTC')).toEqual(mockPrice);
      expect(result.get('ETH')?.symbol).toBe('ETH');
    });

    it('should fetch uncached symbols from primary adapter', async () => {
      // Arrange
      const symbols = ['BTC', 'ETH'];
      mockCacheService.get.mockResolvedValue(null);

      const ethPrice = { ...mockPrice, symbol: 'ETH', name: 'Ethereum', price: 3000 };
      const mockPricesMap = new Map([
        ['BTC', mockPrice],
        ['ETH', ethPrice],
      ]);

      const mockGetMultiplePrices = jest.fn().mockResolvedValue(mockPricesMap);
      (service as any).primaryAdapter.getMultiplePrices = mockGetMultiplePrices;

      // Act
      const result = await service.getMultiplePrices(symbols);

      // Assert
      expect(result.size).toBe(2);
      expect(mockGetMultiplePrices).toHaveBeenCalledWith(symbols);
    });

    it('should mix cached and fetched prices', async () => {
      // Arrange
      const symbols = ['BTC', 'ETH'];
      mockCacheService.get
        .mockResolvedValueOnce(mockPrice) // BTC cached
        .mockResolvedValueOnce(null); // ETH not cached

      const ethPrice = { ...mockPrice, symbol: 'ETH', name: 'Ethereum', price: 3000 };
      const mockPricesMap = new Map([['ETH', ethPrice]]);

      const mockGetMultiplePrices = jest.fn().mockResolvedValue(mockPricesMap);
      (service as any).primaryAdapter.getMultiplePrices = mockGetMultiplePrices;

      // Act
      const result = await service.getMultiplePrices(symbols);

      // Assert
      expect(result.size).toBe(2);
      expect(result.get('BTC')).toEqual(mockPrice);
      expect(result.get('ETH')).toEqual(ethPrice);
      expect(mockGetMultiplePrices).toHaveBeenCalledWith(['ETH']);
    });
  });

  describe('getHistoricalPrices', () => {
    const mockHistory: PriceHistory[] = [
      { timestamp: new Date(), price: 50000, volume: 1000000 },
      { timestamp: new Date(), price: 49000, volume: 900000 },
    ];

    it('should return cached historical prices from Redis', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(mockHistory);

      // Act
      const result = await service.getHistoricalPrices('BTC', '1h');

      // Assert
      expect(result).toEqual(mockHistory);
      expect(mockCacheService.get).toHaveBeenCalledWith('history:BTC:1h');
    });

    it('should fetch from primary adapter when cache misses', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findHistoricalPrices.mockResolvedValue([]);

      const mockGetHistoricalPrices = jest.fn().mockResolvedValue(mockHistory);
      (service as any).primaryAdapter.getHistoricalPrices = mockGetHistoricalPrices;

      // Act
      const result = await service.getHistoricalPrices('BTC', '1h');

      // Assert
      expect(result).toEqual(mockHistory);
      expect(mockGetHistoricalPrices).toHaveBeenCalledWith('BTC', '1h');
    });

    it('should fallback to CoinGecko when Binance fails', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findHistoricalPrices.mockResolvedValue([]);

      const mockPrimaryGetHistory = jest.fn().mockRejectedValue(new Error('Binance error'));
      const mockFallbackGetHistory = jest.fn().mockResolvedValue(mockHistory);
      (service as any).primaryAdapter.getHistoricalPrices = mockPrimaryGetHistory;
      (service as any).fallbackAdapter.getHistoricalPrices = mockFallbackGetHistory;

      // Act
      const result = await service.getHistoricalPrices('BTC', '1h');

      // Assert
      expect(result).toEqual(mockHistory);
      expect(mockFallbackGetHistory).toHaveBeenCalledWith('BTC', '1h');
    });
  });

  describe('getAdapterStatus', () => {
    it('should return status of both adapters', async () => {
      // Arrange
      const mockPrimaryAvailable = jest.fn().mockResolvedValue(true);
      const mockFallbackAvailable = jest.fn().mockResolvedValue(true);
      (service as any).primaryAdapter.isAvailable = mockPrimaryAvailable;
      (service as any).fallbackAdapter.isAvailable = mockFallbackAvailable;

      // Act
      const result = await service.getAdapterStatus();

      // Assert
      expect(result).toEqual({
        primary: true,
        fallback: true,
        activeFallback: false,
      });
    });

    it('should indicate active fallback when primary is unavailable', async () => {
      // Arrange
      const mockPrimaryAvailable = jest.fn().mockResolvedValue(false);
      const mockFallbackAvailable = jest.fn().mockResolvedValue(true);
      (service as any).primaryAdapter.isAvailable = mockPrimaryAvailable;
      (service as any).fallbackAdapter.isAvailable = mockFallbackAvailable;

      // Act
      const result = await service.getAdapterStatus();

      // Assert
      expect(result).toEqual({
        primary: false,
        fallback: true,
        activeFallback: true,
      });
    });

    it('should indicate no fallback when both are unavailable', async () => {
      // Arrange
      const mockPrimaryAvailable = jest.fn().mockResolvedValue(false);
      const mockFallbackAvailable = jest.fn().mockResolvedValue(false);
      (service as any).primaryAdapter.isAvailable = mockPrimaryAvailable;
      (service as any).fallbackAdapter.isAvailable = mockFallbackAvailable;

      // Act
      const result = await service.getAdapterStatus();

      // Assert
      expect(result).toEqual({
        primary: false,
        fallback: false,
        activeFallback: false,
      });
    });
  });

  describe('clearCache', () => {
    it('should clear all caches', async () => {
      // Arrange
      const mockClearAll = jest.fn().mockResolvedValue(undefined);
      (service as any).cache.clearAll = mockClearAll;

      // Act
      await service.clearCache();

      // Assert
      expect(mockClearAll).toHaveBeenCalled();
    });
  });

  describe('getBinanceAdapter', () => {
    it('should return Binance adapter instance', () => {
      // Act
      const adapter = service.getBinanceAdapter();

      // Assert
      expect(adapter).toBeDefined();
      expect(adapter.constructor.name).toBe('BinanceAdapter');
    });

    it('should throw error if primary adapter is not Binance', () => {
      // Arrange
      (service as any).primaryAdapter = {};

      // Act & Assert
      expect(() => service.getBinanceAdapter()).toThrow('Primary adapter is not BinanceAdapter');
    });
  });
});
