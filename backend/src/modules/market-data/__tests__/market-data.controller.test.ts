/**
 * Unit tests for MarketDataController
 * Tests HTTP handling with mocked service
 * Target coverage: 90%+
 */

import { Request, Response, NextFunction } from 'express';
import { MarketDataController } from '../market-data.controller';
import { MarketDataService } from '../market-data.service';
import { CryptoPrice, CryptoMarketData, PriceHistory } from '../market-data.types';

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('MarketDataController', () => {
  let controller: MarketDataController;
  let mockService: jest.Mocked<MarketDataService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

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

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock service
    mockService = {
      getCurrentPrice: jest.fn(),
      getFullMarketData: jest.fn(),
      getMultiplePrices: jest.fn(),
      getHistoricalPrices: jest.fn(),
      getAdapterStatus: jest.fn(),
      clearCache: jest.fn(),
      getBinanceAdapter: jest.fn(),
    } as any;

    // Create controller
    controller = new MarketDataController(mockService);

    // Create mock request/response
    mockRequest = {
      params: {},
      query: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('getMarketData', () => {
    it('should return market data for valid symbol', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      mockService.getFullMarketData.mockResolvedValue(mockMarketData);

      // Act
      await controller.getMarketData(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.getFullMarketData).toHaveBeenCalledWith('BTC');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockMarketData,
        timestamp: expect.any(String),
      });
    });

    it('should handle lowercase symbol', async () => {
      // Arrange
      mockRequest.params = { symbol: 'btc' };
      mockService.getFullMarketData.mockResolvedValue(mockMarketData);

      // Act
      await controller.getMarketData(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.getFullMarketData).toHaveBeenCalledWith('BTC');
    });

    it('should return 400 for invalid symbol', async () => {
      // Arrange
      mockRequest.params = { symbol: '' };

      // Act
      await controller.getMarketData(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid symbol parameter',
          details: expect.any(Array),
        },
        timestamp: expect.any(String),
      });
      expect(mockService.getFullMarketData).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      const error = new Error('Service error');
      mockService.getFullMarketData.mockRejectedValue(error);

      // Act
      await controller.getMarketData(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getBatchPrices', () => {
    it('should return prices for multiple symbols', async () => {
      // Arrange
      mockRequest.query = { symbols: 'BTC,ETH' };
      const ethPrice = { ...mockPrice, symbol: 'ETH', name: 'Ethereum', price: 3000 };
      const pricesMap = new Map([
        ['BTC', mockPrice],
        ['ETH', ethPrice],
      ]);
      mockService.getMultiplePrices.mockResolvedValue(pricesMap);

      // Act
      await controller.getBatchPrices(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.getMultiplePrices).toHaveBeenCalledWith(['BTC', 'ETH']);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          BTC: mockPrice,
          ETH: ethPrice,
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle lowercase symbols', async () => {
      // Arrange
      mockRequest.query = { symbols: 'btc,eth,ada' };
      mockService.getMultiplePrices.mockResolvedValue(new Map());

      // Act
      await controller.getBatchPrices(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.getMultiplePrices).toHaveBeenCalledWith(['BTC', 'ETH', 'ADA']);
    });

    it('should handle whitespace in symbols', async () => {
      // Arrange
      mockRequest.query = { symbols: ' BTC , ETH , ADA ' };
      mockService.getMultiplePrices.mockResolvedValue(new Map());

      // Act
      await controller.getBatchPrices(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.getMultiplePrices).toHaveBeenCalledWith(['BTC', 'ETH', 'ADA']);
    });

    it('should return 400 for missing symbols parameter', async () => {
      // Arrange
      mockRequest.query = {};

      // Act
      await controller.getBatchPrices(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid or missing symbols parameter. Provide comma-separated symbols (max 50)',
          details: expect.any(Array),
        },
        timestamp: expect.any(String),
      });
    });

    it('should return 400 for too many symbols', async () => {
      // Arrange
      const symbols = Array.from({ length: 51 }, (_, i) => `SYM${i}`).join(',');
      mockRequest.query = { symbols };

      // Act
      await controller.getBatchPrices(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.query = { symbols: 'BTC,ETH' };
      const error = new Error('Service error');
      mockService.getMultiplePrices.mockRejectedValue(error);

      // Act
      await controller.getBatchPrices(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getHistoricalPrices', () => {
    const mockHistory: PriceHistory[] = [
      { timestamp: new Date(), price: 50000, volume: 1000000 },
      { timestamp: new Date(), price: 49000, volume: 900000 },
    ];

    it('should return historical prices for valid params', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      mockRequest.query = { timeframe: '1h' };
      mockService.getHistoricalPrices.mockResolvedValue(mockHistory);

      // Act
      await controller.getHistoricalPrices(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.getHistoricalPrices).toHaveBeenCalledWith('BTC', '1h');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory,
        timestamp: expect.any(String),
      });
    });

    it('should handle lowercase symbol', async () => {
      // Arrange
      mockRequest.params = { symbol: 'btc' };
      mockRequest.query = { timeframe: '1h' };
      mockService.getHistoricalPrices.mockResolvedValue(mockHistory);

      // Act
      await controller.getHistoricalPrices(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.getHistoricalPrices).toHaveBeenCalledWith('BTC', '1h');
    });

    it('should return 400 for invalid symbol', async () => {
      // Arrange
      mockRequest.params = { symbol: '' };
      mockRequest.query = { timeframe: '1h' };

      // Act
      await controller.getHistoricalPrices(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid symbol parameter',
          details: expect.any(Array),
        },
        timestamp: expect.any(String),
      });
    });

    it('should return 400 for invalid timeframe', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      mockRequest.query = { timeframe: 'invalid' };

      // Act
      await controller.getHistoricalPrices(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid or missing timeframe parameter. Must be one of: 1h, 24h, 7d, 30d, 1y',
          details: expect.any(Array),
        },
        timestamp: expect.any(String),
      });
    });

    it('should return 400 for missing timeframe', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      mockRequest.query = {};

      // Act
      await controller.getHistoricalPrices(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { symbol: 'BTC' };
      mockRequest.query = { timeframe: '1h' };
      const error = new Error('Service error');
      mockService.getHistoricalPrices.mockRejectedValue(error);

      // Act
      await controller.getHistoricalPrices(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getAdapterStatus', () => {
    it('should return adapter status', async () => {
      // Arrange
      const mockStatus = {
        primary: true,
        fallback: true,
        activeFallback: false,
      };
      mockService.getAdapterStatus.mockResolvedValue(mockStatus);

      // Act
      await controller.getAdapterStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.getAdapterStatus).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatus,
        timestamp: expect.any(String),
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Service error');
      mockService.getAdapterStatus.mockRejectedValue(error);

      // Act
      await controller.getAdapterStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
