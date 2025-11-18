import { MarketDataService } from '../market-data.service';
import { MarketDataCache } from '../market-data.cache';
import { BinanceAdapter } from '../binance.adapter';
import { CoinGeckoAdapter } from '../coingecko.adapter';
import { MarketDataRepository } from '../market-data.repository';
import { CacheService } from '../../../shared/services/cache.service';
import {
  CryptoPrice,
  CryptoMarketData,
  PriceHistory,
  Timeframe,
  AdapterConfig
} from '../market-data.types';

/**
 * MarketDataService Unit Tests
 * 
 * Tests service layer with mocked adapters and cache.
 * Target: 95%+ coverage
 */

// Mock modules
jest.mock('../binance.adapter');
jest.mock('../coingecko.adapter');
jest.mock('../market-data.cache');
jest.mock('../../shared/utils/retry.util', () => ({
  retry: jest.fn((fn) => fn())
}));

describe('MarketDataService Unit Tests', () => {
  let service: MarketDataService;
  let mockBinanceAdapter: jest.Mocked<BinanceAdapter>;
  let mockCoinGeckoAdapter: jest.Mocked<CoinGeckoAdapter>;
  let mockCache: jest.Mocked<MarketDataCache>;
  let mockRepository: jest.Mocked<MarketDataRepository>;
  let mockCacheService: jest.Mocked<CacheService>;
  let config: AdapterConfig;

  const mockCryptoPrice: CryptoPrice = {
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
    low24h: 48000,
    lastUpdated: new Date('2024-06-01T10:00:00Z')
  };

  const mockCryptoMarketData: CryptoMarketData = {
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
    low24h: 48000,
    lastUpdated: new Date('2024-06-01T10:00:00Z')
  };

  const mockPriceHistory: PriceHistory[] = [
    { timestamp: new Date('2024-06-01T10:00:00Z'), price: 50000, volume: 1000000000 },
    { timestamp: new Date('2024-06-01T11:00:00Z'), price: 51000, volume: 1100000000 }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock config
    config = {
      binanceApiKey: 'test-key',
      binanceSecretKey: 'test-secret',
      coingeckoApiKey: 'test-coingecko-key',
      cacheTTL: 60,
      retryAttempts: 3,
      retryDelay: 1000
    };

    // Mock repository
    mockRepository = {
      findBySymbol: jest.fn(),
      findBySymbols: jest.fn(),
      findAll: jest.fn(),
      upsert: jest.fn(),
      upsertMany: jest.fn(),
      deleteStale: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      getLastUpdated: jest.fn(),
      search: jest.fn(),
      getMarketStats: jest.fn(),
      deleteAll: jest.fn(),
      findHistoricalPrices: jest.fn(),
      replaceHistoricalPrices: jest.fn()
    } as any;

    // Mock cache service
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      clear: jest.fn()
    } as any;

    // Create service instance
    service = new MarketDataService(config, mockRepository, mockCacheService);

    // Get mock instances that were created by the constructor
    mockCache = (service as any).cache as jest.Mocked<MarketDataCache>;
    mockBinanceAdapter = (service as any).primaryAdapter as jest.Mocked<BinanceAdapter>;
    mockCoinGeckoAdapter = (service as any).fallbackAdapter as jest.Mocked<CoinGeckoAdapter>;

    // Setup cache mock
    mockCache.getPrice = jest.fn();
    mockCache.setPrice = jest.fn();
    mockCache.getFullMarketData = jest.fn();
    mockCache.setFullMarketData = jest.fn();
    mockCache.getHistoricalPrices = jest.fn();
    mockCache.setHistoricalPrices = jest.fn();
    mockCache.clearAll = jest.fn();
  });

  describe('getCurrentPrice', () => {
    it('should return cached price if available', async () => {
      // Arrange
      mockCache.getPrice.mockResolvedValue(mockCryptoPrice);

      // Act
      const result = await service.getCurrentPrice('BTC');

      // Assert
      expect(result).toEqual(mockCryptoPrice);
      expect(mockCache.getPrice).toHaveBeenCalledWith('BTC');
      expect(mockBinanceAdapter.getCurrentPrice).not.toHaveBeenCalled();
      expect(mockCoinGeckoAdapter.getCurrentPrice).not.toHaveBeenCalled();
    });

    it('should fetch from primary adapter if cache miss', async () => {
      // Arrange
      mockCache.getPrice.mockResolvedValue(null);
      mockBinanceAdapter.getCurrentPrice.mockResolvedValue(mockCryptoPrice);

      // Act
      const result = await service.getCurrentPrice('BTC');

      // Assert
      expect(result).toEqual(mockCryptoPrice);
      expect(mockCache.getPrice).toHaveBeenCalledWith('BTC');
      expect(mockBinanceAdapter.getCurrentPrice).toHaveBeenCalledWith('BTC');
      expect(mockCache.setPrice).toHaveBeenCalledWith('BTC', mockCryptoPrice);
    });

    it('should fallback to CoinGecko if Binance fails', async () => {
      // Arrange
      mockCache.getPrice.mockResolvedValue(null);
      mockBinanceAdapter.getCurrentPrice.mockRejectedValue(new Error('Binance API error'));
      mockCoinGeckoAdapter.getCurrentPrice.mockResolvedValue(mockCryptoPrice);

      // Act
      const result = await service.getCurrentPrice('BTC');

      // Assert
      expect(result).toEqual(mockCryptoPrice);
      expect(mockBinanceAdapter.getCurrentPrice).toHaveBeenCalledWith('BTC');
      expect(mockCoinGeckoAdapter.getCurrentPrice).toHaveBeenCalledWith('BTC');
      expect(mockCache.setPrice).toHaveBeenCalledWith('BTC', mockCryptoPrice);
    });

    it('should throw error if both adapters fail', async () => {
      // Arrange
      mockCache.getPrice.mockResolvedValue(null);
      mockBinanceAdapter.getCurrentPrice.mockRejectedValue(new Error('Binance error'));
      mockCoinGeckoAdapter.getCurrentPrice.mockRejectedValue(new Error('CoinGecko error'));

      // Act & Assert
      await expect(service.getCurrentPrice('BTC')).rejects.toThrow('Unable to fetch price for BTC');
      expect(mockCache.setPrice).not.toHaveBeenCalled();
    });
  });

  describe('getFullMarketData', () => {
    it('should return cached full market data if available', async () => {
      // Arrange
      mockCache.getFullMarketData.mockResolvedValue(mockCryptoMarketData);

      // Act
      const result = await service.getFullMarketData('BTC');

      // Assert
      expect(result).toEqual(mockCryptoMarketData);
      expect(mockCache.getFullMarketData).toHaveBeenCalledWith('BTC');
      expect(mockBinanceAdapter.getFullMarketData).not.toHaveBeenCalled();
    });

    it('should fetch from primary adapter if cache miss', async () => {
      // Arrange
      mockCache.getFullMarketData.mockResolvedValue(null);
      (mockBinanceAdapter as any).getFullMarketData = jest.fn().mockResolvedValue(mockCryptoMarketData);

      // Act
      const result = await service.getFullMarketData('BTC');

      // Assert
      expect(result).toEqual(mockCryptoMarketData);
      expect((mockBinanceAdapter as any).getFullMarketData).toHaveBeenCalledWith('BTC');
      expect(mockCache.setFullMarketData).toHaveBeenCalledWith('BTC', mockCryptoMarketData);
    });

    it('should fallback to CoinGecko if Binance fails', async () => {
      // Arrange
      mockCache.getFullMarketData.mockResolvedValue(null);
      (mockBinanceAdapter as any).getFullMarketData = jest.fn().mockRejectedValue(new Error('Binance error'));
      (mockCoinGeckoAdapter as any).getFullMarketData = jest.fn().mockResolvedValue(mockCryptoMarketData);

      // Act
      const result = await service.getFullMarketData('BTC');

      // Assert
      expect(result).toEqual(mockCryptoMarketData);
      expect((mockCoinGeckoAdapter as any).getFullMarketData).toHaveBeenCalledWith('BTC');
      expect(mockCache.setFullMarketData).toHaveBeenCalledWith('BTC', mockCryptoMarketData);
    });

    it('should throw error if fallback adapter does not support full market data', async () => {
      // Arrange
      mockCache.getFullMarketData.mockResolvedValue(null);
      (mockBinanceAdapter as any).getFullMarketData = jest.fn().mockRejectedValue(new Error('Binance error'));
      (mockCoinGeckoAdapter as any).getFullMarketData = jest.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.getFullMarketData('BTC')).rejects.toThrow('Unable to fetch full market data for BTC');
    });

    it('should throw error if both adapters fail', async () => {
      // Arrange
      mockCache.getFullMarketData.mockResolvedValue(null);
      (mockBinanceAdapter as any).getFullMarketData = jest.fn().mockRejectedValue(new Error('Binance error'));
      (mockCoinGeckoAdapter as any).getFullMarketData = jest.fn().mockRejectedValue(new Error('CoinGecko error'));

      // Act & Assert
      await expect(service.getFullMarketData('BTC')).rejects.toThrow('Unable to fetch full market data for BTC');
    });
  });

  describe('getMultiplePrices', () => {
    const ethPrice: CryptoPrice = {
      ...mockCryptoPrice,
      symbol: 'ETH',
      name: 'Ethereum',
      price: 3000
    };

    it('should return all cached prices if all are available', async () => {
      // Arrange
      mockCache.getPrice
        .mockResolvedValueOnce(mockCryptoPrice)  // BTC
        .mockResolvedValueOnce(ethPrice);  // ETH

      // Act
      const result = await service.getMultiplePrices(['BTC', 'ETH']);

      // Assert
      expect(result.size).toBe(2);
      expect(result.get('BTC')).toEqual(mockCryptoPrice);
      expect(result.get('ETH')).toEqual(ethPrice);
      expect(mockBinanceAdapter.getMultiplePrices).not.toHaveBeenCalled();
    });

    it('should fetch uncached prices from primary adapter', async () => {
      // Arrange
      mockCache.getPrice
        .mockResolvedValueOnce(mockCryptoPrice)  // BTC cached
        .mockResolvedValueOnce(null);  // ETH not cached

      const fetchedPrices = new Map([['ETH', ethPrice]]);
      mockBinanceAdapter.getMultiplePrices.mockResolvedValue(fetchedPrices);

      // Act
      const result = await service.getMultiplePrices(['BTC', 'ETH']);

      // Assert
      expect(result.size).toBe(2);
      expect(result.get('BTC')).toEqual(mockCryptoPrice);
      expect(result.get('ETH')).toEqual(ethPrice);
      expect(mockBinanceAdapter.getMultiplePrices).toHaveBeenCalledWith(['ETH']);
      expect(mockCache.setPrice).toHaveBeenCalledWith('ETH', ethPrice);
    });

    it('should fallback to CoinGecko if Binance fails', async () => {
      // Arrange
      mockCache.getPrice
        .mockResolvedValueOnce(null)  // BTC not cached
        .mockResolvedValueOnce(null);  // ETH not cached

      mockBinanceAdapter.getMultiplePrices.mockRejectedValue(new Error('Binance error'));

      const fetchedPrices = new Map([
        ['BTC', mockCryptoPrice],
        ['ETH', ethPrice]
      ]);
      mockCoinGeckoAdapter.getMultiplePrices.mockResolvedValue(fetchedPrices);

      // Act
      const result = await service.getMultiplePrices(['BTC', 'ETH']);

      // Assert
      expect(result.size).toBe(2);
      expect(mockCoinGeckoAdapter.getMultiplePrices).toHaveBeenCalledWith(['BTC', 'ETH']);
    });

    it('should throw error if both adapters fail', async () => {
      // Arrange
      mockCache.getPrice
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockBinanceAdapter.getMultiplePrices.mockRejectedValue(new Error('Binance error'));
      mockCoinGeckoAdapter.getMultiplePrices.mockRejectedValue(new Error('CoinGecko error'));

      // Act & Assert
      await expect(service.getMultiplePrices(['BTC', 'ETH'])).rejects.toThrow('Unable to fetch cryptocurrency prices');
    });
  });

  describe('getHistoricalPrices', () => {
    const timeframe: Timeframe = '1h';

    it('should return cached historical prices if available', async () => {
      // Arrange
      mockCache.getHistoricalPrices.mockResolvedValue(mockPriceHistory);

      // Act
      const result = await service.getHistoricalPrices('BTC', timeframe);

      // Assert
      expect(result).toEqual(mockPriceHistory);
      expect(mockCache.getHistoricalPrices).toHaveBeenCalledWith('BTC', timeframe);
      expect(mockBinanceAdapter.getHistoricalPrices).not.toHaveBeenCalled();
    });

    it('should fetch from primary adapter if cache miss', async () => {
      // Arrange
      mockCache.getHistoricalPrices.mockResolvedValue(null);
      mockBinanceAdapter.getHistoricalPrices.mockResolvedValue(mockPriceHistory);

      // Act
      const result = await service.getHistoricalPrices('BTC', timeframe);

      // Assert
      expect(result).toEqual(mockPriceHistory);
      expect(mockBinanceAdapter.getHistoricalPrices).toHaveBeenCalledWith('BTC', timeframe);
      expect(mockCache.setHistoricalPrices).toHaveBeenCalledWith('BTC', timeframe, mockPriceHistory);
    });

    it('should fallback to CoinGecko if Binance fails', async () => {
      // Arrange
      mockCache.getHistoricalPrices.mockResolvedValue(null);
      mockBinanceAdapter.getHistoricalPrices.mockRejectedValue(new Error('Binance error'));
      mockCoinGeckoAdapter.getHistoricalPrices.mockResolvedValue(mockPriceHistory);

      // Act
      const result = await service.getHistoricalPrices('BTC', timeframe);

      // Assert
      expect(result).toEqual(mockPriceHistory);
      expect(mockCoinGeckoAdapter.getHistoricalPrices).toHaveBeenCalledWith('BTC', timeframe);
      expect(mockCache.setHistoricalPrices).toHaveBeenCalledWith('BTC', timeframe, mockPriceHistory);
    });

    it('should throw error if both adapters fail', async () => {
      // Arrange
      mockCache.getHistoricalPrices.mockResolvedValue(null);
      mockBinanceAdapter.getHistoricalPrices.mockRejectedValue(new Error('Binance error'));
      mockCoinGeckoAdapter.getHistoricalPrices.mockRejectedValue(new Error('CoinGecko error'));

      // Act & Assert
      await expect(service.getHistoricalPrices('BTC', timeframe)).rejects.toThrow('Unable to fetch historical data for BTC');
    });
  });

  describe('getAdapterStatus', () => {
    it('should return status with both adapters available', async () => {
      // Arrange
      mockBinanceAdapter.isAvailable.mockResolvedValue(true);
      mockCoinGeckoAdapter.isAvailable.mockResolvedValue(true);

      // Act
      const result = await service.getAdapterStatus();

      // Assert
      expect(result).toEqual({
        primary: true,
        fallback: true,
        activeFallback: false
      });
    });

    it('should return status with primary unavailable', async () => {
      // Arrange
      mockBinanceAdapter.isAvailable.mockResolvedValue(false);
      mockCoinGeckoAdapter.isAvailable.mockResolvedValue(true);

      // Act
      const result = await service.getAdapterStatus();

      // Assert
      expect(result).toEqual({
        primary: false,
        fallback: true,
        activeFallback: true
      });
    });

    it('should return status with both unavailable', async () => {
      // Arrange
      mockBinanceAdapter.isAvailable.mockResolvedValue(false);
      mockCoinGeckoAdapter.isAvailable.mockResolvedValue(false);

      // Act
      const result = await service.getAdapterStatus();

      // Assert
      expect(result).toEqual({
        primary: false,
        fallback: false,
        activeFallback: false
      });
    });

    it('should return status with only primary available', async () => {
      // Arrange
      mockBinanceAdapter.isAvailable.mockResolvedValue(true);
      mockCoinGeckoAdapter.isAvailable.mockResolvedValue(false);

      // Act
      const result = await service.getAdapterStatus();

      // Assert
      expect(result).toEqual({
        primary: true,
        fallback: false,
        activeFallback: false
      });
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      // Arrange
      mockCache.clearAll.mockResolvedValue(undefined);

      // Act
      await service.clearCache();

      // Assert
      expect(mockCache.clearAll).toHaveBeenCalled();
    });
  });

  describe('getBinanceAdapter', () => {
    it('should return the Binance adapter instance', () => {
      // Act
      const adapter = service.getBinanceAdapter();

      // Assert
      expect(adapter).toBe(mockBinanceAdapter);
      expect(adapter).toBeInstanceOf(BinanceAdapter);
    });

    it('should throw error if primary adapter is not BinanceAdapter', () => {
      // Arrange
      // Replace primary adapter with something else
      (service as any).primaryAdapter = {};

      // Act & Assert
      expect(() => service.getBinanceAdapter()).toThrow('Primary adapter is not BinanceAdapter');
    });
  });

  describe('Error Handling', () => {
    it('should handle cache errors gracefully in getCurrentPrice', async () => {
      // Arrange
      mockCache.getPrice.mockRejectedValue(new Error('Cache error'));
      mockBinanceAdapter.getCurrentPrice.mockResolvedValue(mockCryptoPrice);

      // Act
      const result = await service.getCurrentPrice('BTC');

      // Assert
      expect(result).toEqual(mockCryptoPrice);
    });

    it('should handle cache set errors gracefully', async () => {
      // Arrange
      mockCache.getPrice.mockResolvedValue(null);
      mockBinanceAdapter.getCurrentPrice.mockResolvedValue(mockCryptoPrice);
      mockCache.setPrice.mockRejectedValue(new Error('Cache set error'));

      // Act
      const result = await service.getCurrentPrice('BTC');

      // Assert
      expect(result).toEqual(mockCryptoPrice);
      // Should not throw despite cache set error
    });
  });

  describe('Symbol Normalization', () => {
    it('should pass symbols as-is to adapters and cache', async () => {
      // Arrange
      mockCache.getPrice.mockResolvedValue(null);
      mockBinanceAdapter.getCurrentPrice.mockResolvedValue(mockCryptoPrice);

      // Act
      await service.getCurrentPrice('btc');

      // Assert
      expect(mockCache.getPrice).toHaveBeenCalledWith('btc');
      expect(mockBinanceAdapter.getCurrentPrice).toHaveBeenCalledWith('btc');
      expect(mockCache.setPrice).toHaveBeenCalledWith('btc', mockCryptoPrice);
    });
  });

  describe('Retry Logic Integration', () => {
    it('should retry failed primary adapter calls', async () => {
      // Arrange
      const { retry } = require('../../shared/utils/retry.util');
      mockCache.getPrice.mockResolvedValue(null);
      
      let callCount = 0;
      const mockRetry = retry as jest.Mock;
      mockRetry.mockImplementation(async (fn: any) => {
        callCount++;
        return fn();
      });

      mockBinanceAdapter.getCurrentPrice.mockResolvedValue(mockCryptoPrice);

      // Act
      await service.getCurrentPrice('BTC');

      // Assert
      expect(mockRetry).toHaveBeenCalled();
    });
  });
});
