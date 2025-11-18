/**
 * T018: Portfolio Controller Unit Tests
 * Tests controller layer with mocked service (90%+ coverage target)
 *
 * Tests verify:
 * - HTTP concerns only (req/res handling)
 * - Proper status codes
 * - Response format
 * - Error delegation to next()
 * - Service method calls with correct parameters
 */

import { Request, Response, NextFunction } from 'express';
import { PortfolioController } from '../portfolio.controller';
import { PortfolioService } from '../portfolio.service';
import { BinanceSyncService } from '../binance-sync.service';

// Mock logger to avoid console noise in tests
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('PortfolioController Unit Tests', () => {
  let controller: PortfolioController;
  let mockPortfolioService: jest.Mocked<PortfolioService>;
  let mockBinanceSyncService: jest.Mocked<BinanceSyncService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Create mock service with all methods
    mockPortfolioService = {
      getPortfolios: jest.fn(),
      createPortfolio: jest.fn(),
      getPortfolioById: jest.fn(),
      updatePortfolio: jest.fn(),
      deletePortfolio: jest.fn(),
      calculatePortfolioStatistics: jest.fn(),
      getPortfolioAllocation: jest.fn(),
    } as any;

    mockBinanceSyncService = {
      syncFromBinance: jest.fn(),
    } as any;

    // Initialize controller
    controller = new PortfolioController(mockPortfolioService, mockBinanceSyncService);

    // Setup mock request, response, next
    mockRequest = {
      headers: { 'x-user-id': 'test-user-123' },
      params: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('getPortfolios', () => {
    it('should return portfolios with 200 status', async () => {
      const mockPortfolios = [
        { id: '1', name: 'Portfolio 1', userId: 'test-user-123' },
        { id: '2', name: 'Portfolio 2', userId: 'test-user-123' },
      ];
      mockPortfolioService.getPortfolios.mockResolvedValue(mockPortfolios as any);

      await controller.getPortfolios(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPortfolioService.getPortfolios).toHaveBeenCalledWith('test-user-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockPortfolios,
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use default userId if not provided in headers', async () => {
      mockRequest.headers = {};
      mockPortfolioService.getPortfolios.mockResolvedValue([]);

      await controller.getPortfolios(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPortfolioService.getPortfolios).toHaveBeenCalledWith('mock-user-id');
    });

    it('should call next with error on service failure', async () => {
      const error = new Error('Service error');
      mockPortfolioService.getPortfolios.mockRejectedValue(error);

      await controller.getPortfolios(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('createPortfolio', () => {
    it('should create portfolio and return 201 status', async () => {
      const portfolioData = { name: 'New Portfolio', description: 'Test' };
      const createdPortfolio = { id: '123', ...portfolioData, userId: 'test-user-123' };

      mockRequest.body = portfolioData;
      mockPortfolioService.createPortfolio.mockResolvedValue(createdPortfolio as any);

      await controller.createPortfolio(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPortfolioService.createPortfolio).toHaveBeenCalledWith(
        'test-user-123',
        portfolioData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: createdPortfolio,
        message: 'Portfolio created successfully',
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error on service failure', async () => {
      const error = new Error('Creation failed');
      mockRequest.body = { name: 'Test' };
      mockPortfolioService.createPortfolio.mockRejectedValue(error);

      await controller.createPortfolio(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('getPortfolioById', () => {
    it('should return portfolio with 200 status', async () => {
      const portfolioId = 'portfolio-123';
      const mockPortfolio = {
        id: portfolioId,
        name: 'Test Portfolio',
        holdings: [],
      };

      mockRequest.params = { id: portfolioId };
      mockPortfolioService.getPortfolioById.mockResolvedValue(mockPortfolio as any);

      await controller.getPortfolioById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPortfolioService.getPortfolioById).toHaveBeenCalledWith(portfolioId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockPortfolio,
        timestamp: expect.any(String),
      });
    });

    it('should call next with error if portfolio not found', async () => {
      const error = new Error('Portfolio not found');
      mockRequest.params = { id: 'non-existent' };
      mockPortfolioService.getPortfolioById.mockRejectedValue(error);

      await controller.getPortfolioById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updatePortfolio', () => {
    it('should update portfolio and return 200 status', async () => {
      const portfolioId = 'portfolio-123';
      const updateData = { name: 'Updated Name' };
      const updatedPortfolio = { id: portfolioId, ...updateData };

      mockRequest.params = { id: portfolioId };
      mockRequest.body = updateData;
      mockPortfolioService.updatePortfolio.mockResolvedValue(updatedPortfolio as any);

      await controller.updatePortfolio(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPortfolioService.updatePortfolio).toHaveBeenCalledWith(
        portfolioId,
        updateData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: updatedPortfolio,
        message: 'Portfolio updated successfully',
        timestamp: expect.any(String),
      });
    });

    it('should call next with error on update failure', async () => {
      const error = new Error('Update failed');
      mockRequest.params = { id: 'portfolio-123' };
      mockRequest.body = { name: 'Updated' };
      mockPortfolioService.updatePortfolio.mockRejectedValue(error);

      await controller.updatePortfolio(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deletePortfolio', () => {
    it('should delete portfolio and return 204 status', async () => {
      const portfolioId = 'portfolio-123';
      mockRequest.params = { id: portfolioId };
      mockPortfolioService.deletePortfolio.mockResolvedValue(undefined);

      await controller.deletePortfolio(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPortfolioService.deletePortfolio).toHaveBeenCalledWith(portfolioId);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error on deletion failure', async () => {
      const error = new Error('Deletion failed');
      mockRequest.params = { id: 'portfolio-123' };
      mockPortfolioService.deletePortfolio.mockRejectedValue(error);

      await controller.deletePortfolio(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.send).not.toHaveBeenCalled();
    });
  });

  describe('getPortfolioStatistics', () => {
    it('should return statistics with 200 status', async () => {
      const portfolioId = 'portfolio-123';
      const mockStatistics = {
        totalValue: 10000,
        totalGainLoss: 500,
        totalGainLossPercentage: 5.0,
        bestPerformer: { symbol: 'BTC', gainLossPercentage: 10 },
        worstPerformer: { symbol: 'ETH', gainLossPercentage: -2 },
      };

      mockRequest.params = { id: portfolioId };
      mockPortfolioService.calculatePortfolioStatistics.mockResolvedValue(mockStatistics as any);

      await controller.getPortfolioStatistics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPortfolioService.calculatePortfolioStatistics).toHaveBeenCalledWith(portfolioId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatistics,
        timestamp: expect.any(String),
      });
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Statistics calculation failed');
      mockRequest.params = { id: 'portfolio-123' };
      mockPortfolioService.calculatePortfolioStatistics.mockRejectedValue(error);

      await controller.getPortfolioStatistics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getPortfolioAllocation', () => {
    it('should return allocation data with 200 status', async () => {
      const portfolioId = 'portfolio-123';
      const mockAllocation = [
        { symbol: 'BTC', name: 'Bitcoin', value: 5000, percentage: 50, color: '#F7931A' },
        { symbol: 'ETH', name: 'Ethereum', value: 3000, percentage: 30, color: '#627EEA' },
        { symbol: 'ADA', name: 'Cardano', value: 2000, percentage: 20, color: '#0033AD' },
      ];

      mockRequest.params = { id: portfolioId };
      mockPortfolioService.getPortfolioAllocation.mockResolvedValue(mockAllocation as any);

      await controller.getPortfolioAllocation(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPortfolioService.getPortfolioAllocation).toHaveBeenCalledWith(portfolioId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAllocation,
        timestamp: expect.any(String),
      });
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Allocation calculation failed');
      mockRequest.params = { id: 'portfolio-123' };
      mockPortfolioService.getPortfolioAllocation.mockRejectedValue(error);

      await controller.getPortfolioAllocation(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('syncFromBinance', () => {
    it('should sync from Binance and return 200 status', async () => {
      const mockSyncResult = {
        portfolio: { id: 'portfolio-123', name: 'Binance Portfolio' },
        totalHoldings: 5,
        syncedAt: new Date().toISOString(),
      };

      mockBinanceSyncService.syncFromBinance.mockResolvedValue(mockSyncResult as any);

      await controller.syncFromBinance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBinanceSyncService.syncFromBinance).toHaveBeenCalledWith('test-user-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSyncResult,
        message: 'Successfully synced 5 holdings from Binance',
        timestamp: expect.any(String),
      });
    });

    it('should return 501 if Binance sync service not configured', async () => {
      const controllerWithoutSync = new PortfolioController(mockPortfolioService);

      await controllerWithoutSync.syncFromBinance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

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
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error on sync failure', async () => {
      const error = new Error('Binance API error');
      mockBinanceSyncService.syncFromBinance.mockRejectedValue(error);

      await controller.syncFromBinance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
