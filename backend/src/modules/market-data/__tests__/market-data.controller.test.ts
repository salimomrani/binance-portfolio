import { Request, Response, NextFunction } from 'express';
import {
  createGetMarketDataHandler,
  createGetBatchPricesHandler,
  createGetHistoricalPricesHandler,
  createGetAdapterStatusHandler,
  createMarketDataHandlers
} from '../market-data.controller';
import { MarketDataService } from '../market-data.service';
import { CryptoMarketData, CryptoPrice, PriceHistory } from '../market-data.types';

/**
 * MarketDataController Unit Tests
 * 
 * Tests controller layer with mocked service.
 * Target: 90%+ coverage
 */

describe('MarketDataController Unit Tests', () => {
  let mockService: jest.Mocked<MarketDataService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  const mockMarketData: CryptoMarketData = {
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
    // Mock service
    mockService = {
      getFullMarketData: jest.fn(),
      getMultiplePrices: jest.fn(),
      getHistoricalPrices: jest.fn(),
      getAdapterStatus: jest.fn(),
      getCurrentPrice: jest.fn(),
      clearCache: jest.fn(),
      getBinanceAdapter: jest.fn()
    } as any;

    // Mock request
    mockRequest = {
      params: {},
      query: {},
      body: {},
      headers: {}
    };

    // Mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    // Mock next
    mockNext = jest.fn();
  });

  describe('createGetMarketDataHandler', () => {
    it('should return market data for valid symbol', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      mockService.getFullMarketData.mockResolvedValue(mockMarketData);
      const handler = createGetMarketDataHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getFullMarketData).toHaveBeenCalledWith('BTC');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockMarketData,
        timestamp: expect.any(String)
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle lowercase symbols by converting to uppercase', async () => {
      // Arrange
      mockRequest.params = { symbol: 'btc' };
      mockService.getFullMarketData.mockResolvedValue(mockMarketData);
      const handler = createGetMarketDataHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getFullMarketData).toHaveBeenCalledWith('BTC');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for missing symbol', async () => {
      // Arrange
      mockRequest.params = {};
      const handler = createGetMarketDataHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getFullMarketData).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid symbol parameter',
          details: expect.any(Array)
        },
        timestamp: expect.any(String)
      });
    });

    it('should return 400 for invalid symbol (too long)', async () => {
      // Arrange
      mockRequest.params = { symbol: 'VERYLONGSYMBOL123' };
      const handler = createGetMarketDataHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getFullMarketData).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for empty symbol', async () => {
      // Arrange
      mockRequest.params = { symbol: '' };
      const handler = createGetMarketDataHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getFullMarketData).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      const serviceError = new Error('Service error');
      mockService.getFullMarketData.mockRejectedValue(serviceError);
      const handler = createGetMarketDataHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('createGetBatchPricesHandler', () => {
    it('should return batch prices for valid symbols', async () => {
      // Arrange
      mockRequest.query = { symbols: 'BTC,ETH,ADA' };
      const mockPrices = new Map<string, CryptoPrice>([
        ['BTC', { ...mockMarketData, symbol: 'BTC' } as CryptoPrice],
        ['ETH', { ...mockMarketData, symbol: 'ETH', price: 3000 } as CryptoPrice],
        ['ADA', { ...mockMarketData, symbol: 'ADA', price: 0.5 } as CryptoPrice]
      ]);
      mockService.getMultiplePrices.mockResolvedValue(mockPrices);
      const handler = createGetBatchPricesHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getMultiplePrices).toHaveBeenCalledWith(['BTC', 'ETH', 'ADA']);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          BTC: expect.objectContaining({ symbol: 'BTC' }),
          ETH: expect.objectContaining({ symbol: 'ETH' }),
          ADA: expect.objectContaining({ symbol: 'ADA' })
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle lowercase symbols by converting to uppercase', async () => {
      // Arrange
      mockRequest.query = { symbols: 'btc,eth' };
      const mockPrices = new Map<string, CryptoPrice>();
      mockService.getMultiplePrices.mockResolvedValue(mockPrices);
      const handler = createGetBatchPricesHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getMultiplePrices).toHaveBeenCalledWith(['BTC', 'ETH']);
    });

    it('should trim whitespace from symbols', async () => {
      // Arrange
      mockRequest.query = { symbols: ' BTC , ETH , ADA ' };
      const mockPrices = new Map<string, CryptoPrice>();
      mockService.getMultiplePrices.mockResolvedValue(mockPrices);
      const handler = createGetBatchPricesHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getMultiplePrices).toHaveBeenCalledWith(['BTC', 'ETH', 'ADA']);
    });

    it('should return 400 for missing symbols parameter', async () => {
      // Arrange
      mockRequest.query = {};
      const handler = createGetBatchPricesHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getMultiplePrices).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('symbols parameter'),
          details: expect.any(Array)
        },
        timestamp: expect.any(String)
      });
    });

    it('should return 400 for too many symbols (>50)', async () => {
      // Arrange
      const symbols = Array.from({ length: 51 }, (_, i) => `SYM${i}`).join(',');
      mockRequest.query = { symbols };
      const handler = createGetBatchPricesHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getMultiplePrices).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for empty symbols string', async () => {
      // Arrange
      mockRequest.query = { symbols: '' };
      const handler = createGetBatchPricesHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getMultiplePrices).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      mockRequest.query = { symbols: 'BTC,ETH' };
      const serviceError = new Error('Service error');
      mockService.getMultiplePrices.mockRejectedValue(serviceError);
      const handler = createGetBatchPricesHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('createGetHistoricalPricesHandler', () => {
    it('should return historical prices for valid symbol and timeframe', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      mockRequest.query = { timeframe: '1h' };
      mockService.getHistoricalPrices.mockResolvedValue(mockPriceHistory);
      const handler = createGetHistoricalPricesHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getHistoricalPrices).toHaveBeenCalledWith('BTC', '1h');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockPriceHistory,
        timestamp: expect.any(String)
      });
    });

    it('should handle lowercase symbols', async () => {
      // Arrange
      mockRequest.params = { symbol: 'btc' };
      mockRequest.query = { timeframe: '24h' };
      mockService.getHistoricalPrices.mockResolvedValue(mockPriceHistory);
      const handler = createGetHistoricalPricesHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getHistoricalPrices).toHaveBeenCalledWith('BTC', '24h');
    });

    it('should support all valid timeframes', async () => {
      // Arrange
      const timeframes = ['1h', '24h', '7d', '30d', '1y'];
      const handler = createGetHistoricalPricesHandler(mockService);
      mockService.getHistoricalPrices.mockResolvedValue(mockPriceHistory);

      // Act & Assert
      for (const timeframe of timeframes) {
        mockRequest.params = { symbol: 'BTC' };
        mockRequest.query = { timeframe };
        mockResponse.status = jest.fn().mockReturnThis();
        mockResponse.json = jest.fn().mockReturnThis();

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
      }
    });

    it('should return 400 for missing symbol', async () => {
      // Arrange
      mockRequest.params = {};
      mockRequest.query = { timeframe: '1h' };
      const handler = createGetHistoricalPricesHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getHistoricalPrices).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for missing timeframe', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      mockRequest.query = {};
      const handler = createGetHistoricalPricesHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getHistoricalPrices).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('timeframe'),
          details: expect.any(Array)
        },
        timestamp: expect.any(String)
      });
    });

    it('should return 400 for invalid timeframe', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      mockRequest.query = { timeframe: 'invalid' };
      const handler = createGetHistoricalPricesHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getHistoricalPrices).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      mockRequest.query = { timeframe: '1h' };
      const serviceError = new Error('Service error');
      mockService.getHistoricalPrices.mockRejectedValue(serviceError);
      const handler = createGetHistoricalPricesHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('createGetAdapterStatusHandler', () => {
    it('should return adapter status', async () => {
      // Arrange
      const mockStatus = {
        primary: true,
        fallback: true,
        activeFallback: false
      };
      mockService.getAdapterStatus.mockResolvedValue(mockStatus);
      const handler = createGetAdapterStatusHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getAdapterStatus).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatus,
        timestamp: expect.any(String)
      });
    });

    it('should return status when primary is down', async () => {
      // Arrange
      const mockStatus = {
        primary: false,
        fallback: true,
        activeFallback: true
      };
      mockService.getAdapterStatus.mockResolvedValue(mockStatus);
      const handler = createGetAdapterStatusHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatus,
        timestamp: expect.any(String)
      });
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      const serviceError = new Error('Service error');
      mockService.getAdapterStatus.mockRejectedValue(serviceError);
      const handler = createGetAdapterStatusHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('createMarketDataHandlers', () => {
    it('should create all handlers', () => {
      // Act
      const handlers = createMarketDataHandlers(mockService);

      // Assert
      expect(handlers).toHaveProperty('getMarketData');
      expect(handlers).toHaveProperty('getBatchPrices');
      expect(handlers).toHaveProperty('getHistoricalPrices');
      expect(handlers).toHaveProperty('getAdapterStatus');
      expect(typeof handlers.getMarketData).toBe('function');
      expect(typeof handlers.getBatchPrices).toBe('function');
      expect(typeof handlers.getHistoricalPrices).toBe('function');
      expect(typeof handlers.getAdapterStatus).toBe('function');
    });

    it('should create handlers that work correctly', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      mockService.getFullMarketData.mockResolvedValue(mockMarketData);
      const handlers = createMarketDataHandlers(mockService);

      // Act
      await handlers.getMarketData(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Response Format', () => {
    it('should include timestamp in all success responses', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      mockService.getFullMarketData.mockResolvedValue(mockMarketData);
      const handler = createGetMarketDataHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String)
        })
      );
    });

    it('should include timestamp in all error responses', async () => {
      // Arrange
      mockRequest.params = {};
      const handler = createGetMarketDataHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String)
        })
      );
    });

    it('should mark success responses with success: true', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      mockService.getFullMarketData.mockResolvedValue(mockMarketData);
      const handler = createGetMarketDataHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('should mark error responses with success: false', async () => {
      // Arrange
      mockRequest.params = {};
      const handler = createGetMarketDataHandler(mockService);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });
});
