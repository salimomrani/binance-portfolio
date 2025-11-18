/**
 * Unit tests for PortfolioController
 * Tests HTTP handling with mocked service
 * Target coverage: 90%+
 * T018: Portfolio controller unit tests
 */

import { Request, Response, NextFunction } from 'express';
import { PortfolioController } from '../portfolio.controller';
import { PortfolioService } from '../portfolio.service';
import { BinanceSyncService } from '../binance-sync.service';
import { Portfolio } from '@prisma/client';

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('PortfolioController', () => {
  let controller: PortfolioController;
  let mockService: jest.Mocked<PortfolioService>;
  let mockBinanceSyncService: jest.Mocked<BinanceSyncService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockPortfolio: Portfolio = {
    id: 'portfolio-1',
    userId: 'user-1',
    name: 'Test Portfolio',
    description: 'Test Description',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPortfolioSummary = {
    id: 'portfolio-1',
    name: 'Test Portfolio',
    description: 'Test Description',
    isDefault: false,
    totalValue: 10000,
    totalInvested: 8000,
    totalGainLoss: 2000,
    totalGainLossPercent: 25,
    holdingsCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPortfolioDetails = {
    ...mockPortfolio,
    holdings: [],
    totalValue: 10000,
    totalInvested: 8000,
    totalGainLoss: 2000,
    totalGainLossPercent: 25,
  };

  const mockStatistics = {
    totalValue: 10000,
    totalInvested: 8000,
    totalGainLoss: 2000,
    totalGainLossPercent: 25,
    bestPerformer: { symbol: 'BTC', gainLossPercent: 50 },
    worstPerformer: { symbol: 'ETH', gainLossPercent: -10 },
    diversificationScore: 0.8,
  };

  const mockAllocation = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      value: 5000,
      percentage: 50,
      color: '#F7931A',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      value: 3000,
      percentage: 30,
      color: '#627EEA',
    },
  ];

  const mockSyncResult = {
    portfolioId: 'portfolio-1',
    totalHoldings: 10,
    totalValue: 15000,
    syncedAt: new Date(),
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock service
    mockService = {
      createPortfolio: jest.fn(),
      getPortfolios: jest.fn(),
      getPortfolioById: jest.fn(),
      updatePortfolio: jest.fn(),
      deletePortfolio: jest.fn(),
      calculatePortfolioStatistics: jest.fn(),
      getPortfolioAllocation: jest.fn(),
    } as any;

    // Create mock Binance sync service
    mockBinanceSyncService = {
      syncFromBinance: jest.fn(),
    } as any;

    // Create controller
    controller = new PortfolioController(mockService, mockBinanceSyncService);

    // Create mock request/response
    mockRequest = {
      params: {},
      query: {},
      body: {},
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('getPortfolios', () => {
    it('should return portfolios for a user', async () => {
      // Arrange
      mockRequest.headers = { 'x-user-id': 'user-1' };
      mockService.getPortfolios.mockResolvedValue([mockPortfolioSummary]);

      // Act
      await controller.getPortfolios(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.getPortfolios).toHaveBeenCalledWith('user-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [mockPortfolioSummary],
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use default userId if header not provided', async () => {
      // Arrange
      mockService.getPortfolios.mockResolvedValue([]);

      // Act
      await controller.getPortfolios(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.getPortfolios).toHaveBeenCalledWith('mock-user-id');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should call next with error on service failure', async () => {
      // Arrange
      const error = new Error('Service error');
      mockService.getPortfolios.mockRejectedValue(error);

      // Act
      await controller.getPortfolios(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('createPortfolio', () => {
    it('should create a portfolio successfully', async () => {
      // Arrange
      const createData = {
        name: 'New Portfolio',
        description: 'Test Description',
      };
      mockRequest.headers = { 'x-user-id': 'user-1' };
      mockRequest.body = createData;
      mockService.createPortfolio.mockResolvedValue(mockPortfolio);

      // Act
      await controller.createPortfolio(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.createPortfolio).toHaveBeenCalledWith('user-1', createData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockPortfolio,
        message: 'Portfolio created successfully',
        timestamp: expect.any(String),
      });
    });

    it('should handle creation errors', async () => {
      // Arrange
      const error = new Error('Creation failed');
      mockRequest.body = { name: 'Test' };
      mockService.createPortfolio.mockRejectedValue(error);

      // Act
      await controller.createPortfolio(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getPortfolioById', () => {
    it('should return portfolio details', async () => {
      // Arrange
      mockRequest.params = { id: 'portfolio-1' };
      mockService.getPortfolioById.mockResolvedValue(mockPortfolioDetails);

      // Act
      await controller.getPortfolioById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.getPortfolioById).toHaveBeenCalledWith('portfolio-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockPortfolioDetails,
        timestamp: expect.any(String),
      });
    });

    it('should handle not found errors', async () => {
      // Arrange
      const error = new Error('Portfolio not found');
      mockRequest.params = { id: 'non-existent' };
      mockService.getPortfolioById.mockRejectedValue(error);

      // Act
      await controller.getPortfolioById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updatePortfolio', () => {
    it('should update portfolio successfully', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Portfolio',
        description: 'Updated Description',
      };
      mockRequest.params = { id: 'portfolio-1' };
      mockRequest.body = updateData;
      mockService.updatePortfolio.mockResolvedValue({
        ...mockPortfolio,
        ...updateData,
      });

      // Act
      await controller.updatePortfolio(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.updatePortfolio).toHaveBeenCalledWith('portfolio-1', updateData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining(updateData),
        message: 'Portfolio updated successfully',
        timestamp: expect.any(String),
      });
    });

    it('should handle update errors', async () => {
      // Arrange
      const error = new Error('Update failed');
      mockRequest.params = { id: 'portfolio-1' };
      mockRequest.body = { name: 'Test' };
      mockService.updatePortfolio.mockRejectedValue(error);

      // Act
      await controller.updatePortfolio(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deletePortfolio', () => {
    it('should delete portfolio successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'portfolio-1' };
      mockService.deletePortfolio.mockResolvedValue(undefined);

      // Act
      await controller.deletePortfolio(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.deletePortfolio).toHaveBeenCalledWith('portfolio-1');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      // Arrange
      const error = new Error('Deletion failed');
      mockRequest.params = { id: 'portfolio-1' };
      mockService.deletePortfolio.mockRejectedValue(error);

      // Act
      await controller.deletePortfolio(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getPortfolioStatistics', () => {
    it('should return portfolio statistics', async () => {
      // Arrange
      mockRequest.params = { id: 'portfolio-1' };
      mockService.calculatePortfolioStatistics.mockResolvedValue(mockStatistics);

      // Act
      await controller.getPortfolioStatistics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.calculatePortfolioStatistics).toHaveBeenCalledWith('portfolio-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatistics,
        timestamp: expect.any(String),
      });
    });

    it('should handle statistics errors', async () => {
      // Arrange
      const error = new Error('Statistics calculation failed');
      mockRequest.params = { id: 'portfolio-1' };
      mockService.calculatePortfolioStatistics.mockRejectedValue(error);

      // Act
      await controller.getPortfolioStatistics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getPortfolioAllocation', () => {
    it('should return portfolio allocation', async () => {
      // Arrange
      mockRequest.params = { id: 'portfolio-1' };
      mockService.getPortfolioAllocation.mockResolvedValue(mockAllocation);

      // Act
      await controller.getPortfolioAllocation(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockService.getPortfolioAllocation).toHaveBeenCalledWith('portfolio-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAllocation,
        timestamp: expect.any(String),
      });
    });

    it('should handle allocation errors', async () => {
      // Arrange
      const error = new Error('Allocation calculation failed');
      mockRequest.params = { id: 'portfolio-1' };
      mockService.getPortfolioAllocation.mockRejectedValue(error);

      // Act
      await controller.getPortfolioAllocation(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('syncFromBinance', () => {
    it('should sync portfolio from Binance successfully', async () => {
      // Arrange
      mockRequest.headers = { 'x-user-id': 'user-1' };
      mockBinanceSyncService.syncFromBinance.mockResolvedValue(mockSyncResult);

      // Act
      await controller.syncFromBinance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockBinanceSyncService.syncFromBinance).toHaveBeenCalledWith('user-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSyncResult,
        message: 'Successfully synced 10 holdings from Binance',
        timestamp: expect.any(String),
      });
    });

    it('should return 501 if Binance sync service not available', async () => {
      // Arrange
      const controllerWithoutSync = new PortfolioController(mockService);
      mockRequest.headers = { 'x-user-id': 'user-1' };

      // Act
      await controllerWithoutSync.syncFromBinance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(501);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVICE_NOT_AVAILABLE',
          message: 'Binance sync service is not configured',
          details: expect.any(String),
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle sync errors', async () => {
      // Arrange
      const error = new Error('Sync failed');
      mockRequest.headers = { 'x-user-id': 'user-1' };
      mockBinanceSyncService.syncFromBinance.mockRejectedValue(error);

      // Act
      await controller.syncFromBinance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
