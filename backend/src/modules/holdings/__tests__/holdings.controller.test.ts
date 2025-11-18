/**
 * Unit tests for Holdings Controller
 * Tests HTTP handling with mocked services
 * Target coverage: 90%+
 * T030: Holdings controller unit tests
 */

import { Request, Response, NextFunction } from 'express';
import {
  createGetHoldingsHandler,
  createAddHoldingHandler,
  createGetHoldingByIdHandler,
  createUpdateHoldingHandler,
  createDeleteHoldingHandler,
  createGetTransactionsHandler,
  createAddTransactionHandler,
  createHoldingsHandlers,
} from '../holdings.controller';
import { HoldingsService } from '../holdings.service';
import { TransactionService } from '../transaction.service';
import { Holding, Transaction, TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Holdings Controller', () => {
  let mockHoldingsService: jest.Mocked<HoldingsService>;
  let mockTransactionService: jest.Mocked<TransactionService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockHolding: Holding = {
    id: 'holding-1',
    portfolioId: 'portfolio-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    quantity: new Decimal(1),
    averageCost: new Decimal(50000),
    notes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockHoldingDetails = {
    id: 'holding-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    quantity: 1,
    averageCost: 50000,
    currentPrice: 60000,
    currentValue: 60000,
    costBasis: 50000,
    gainLoss: 10000,
    gainLossPercentage: 20,
    allocationPercentage: 100,
    priceChange24h: 2.5,
    volume24h: 1000000000,
    marketCap: 1000000000000,
    notes: null,
    lastUpdated: new Date(),
  };

  const mockTransaction: Transaction = {
    id: 'transaction-1',
    holdingId: 'holding-1',
    type: TransactionType.BUY,
    quantity: new Decimal(1),
    pricePerUnit: new Decimal(50000),
    totalCost: new Decimal(50000),
    fee: new Decimal(0),
    date: new Date('2024-01-01'),
    notes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock services
    mockHoldingsService = {
      addHolding: jest.fn(),
      getHoldings: jest.fn(),
      getHoldingById: jest.fn(),
      updateHolding: jest.fn(),
      deleteHolding: jest.fn(),
      calculateHoldingValue: jest.fn(),
    } as any;

    mockTransactionService = {
      addTransaction: jest.fn(),
      getTransactions: jest.fn(),
      updateHoldingAverageCost: jest.fn(),
      deleteTransaction: jest.fn(),
    } as any;

    // Setup mock request/response
    mockRequest = {
      params: {},
      query: {},
      body: {},
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    mockNext = jest.fn();
  });

  // ============================================================
  // Get Holdings
  // ============================================================

  describe('createGetHoldingsHandler', () => {
    it('should return holdings successfully', async () => {
      // Arrange
      const handler = createGetHoldingsHandler(mockHoldingsService);
      mockRequest.params = { portfolioId: 'portfolio-1' };
      mockRequest.query = {};
      mockHoldingsService.getHoldings.mockResolvedValue([mockHoldingDetails]);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockHoldingsService.getHoldings).toHaveBeenCalledWith('portfolio-1', undefined, 'asc');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [mockHoldingDetails],
        timestamp: expect.any(String),
      });
    });

    it('should handle sorting parameters', async () => {
      // Arrange
      const handler = createGetHoldingsHandler(mockHoldingsService);
      mockRequest.params = { portfolioId: 'portfolio-1' };
      mockRequest.query = { sortBy: 'value', order: 'desc' };
      mockHoldingsService.getHoldings.mockResolvedValue([mockHoldingDetails]);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockHoldingsService.getHoldings).toHaveBeenCalledWith('portfolio-1', 'value', 'desc');
    });

    it('should default to asc order when not specified', async () => {
      // Arrange
      const handler = createGetHoldingsHandler(mockHoldingsService);
      mockRequest.params = { portfolioId: 'portfolio-1' };
      mockRequest.query = { sortBy: 'symbol' };
      mockHoldingsService.getHoldings.mockResolvedValue([mockHoldingDetails]);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockHoldingsService.getHoldings).toHaveBeenCalledWith('portfolio-1', 'symbol', 'asc');
    });

    it('should handle errors by calling next', async () => {
      // Arrange
      const handler = createGetHoldingsHandler(mockHoldingsService);
      mockRequest.params = { portfolioId: 'portfolio-1' };
      const error = new Error('Service error');
      mockHoldingsService.getHoldings.mockRejectedValue(error);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Add Holding
  // ============================================================

  describe('createAddHoldingHandler', () => {
    it('should add holding successfully', async () => {
      // Arrange
      const handler = createAddHoldingHandler(mockHoldingsService);
      mockRequest.params = { portfolioId: 'portfolio-1' };
      mockRequest.body = {
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 50000,
      };
      mockHoldingsService.addHolding.mockResolvedValue(mockHolding);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockHoldingsService.addHolding).toHaveBeenCalledWith('portfolio-1', mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockHolding,
        message: 'Holding added successfully',
        timestamp: expect.any(String),
      });
    });

    it('should handle errors by calling next', async () => {
      // Arrange
      const handler = createAddHoldingHandler(mockHoldingsService);
      mockRequest.params = { portfolioId: 'portfolio-1' };
      mockRequest.body = { symbol: 'BTC' };
      const error = new Error('Service error');
      mockHoldingsService.addHolding.mockRejectedValue(error);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Get Holding By ID
  // ============================================================

  describe('createGetHoldingByIdHandler', () => {
    it('should return holding by ID successfully', async () => {
      // Arrange
      const handler = createGetHoldingByIdHandler(mockHoldingsService);
      mockRequest.params = { id: 'holding-1' };
      mockHoldingsService.getHoldingById.mockResolvedValue(mockHoldingDetails);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockHoldingsService.getHoldingById).toHaveBeenCalledWith('holding-1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockHoldingDetails,
        timestamp: expect.any(String),
      });
    });

    it('should handle errors by calling next', async () => {
      // Arrange
      const handler = createGetHoldingByIdHandler(mockHoldingsService);
      mockRequest.params = { id: 'holding-1' };
      const error = new Error('Service error');
      mockHoldingsService.getHoldingById.mockRejectedValue(error);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Update Holding
  // ============================================================

  describe('createUpdateHoldingHandler', () => {
    it('should update holding successfully', async () => {
      // Arrange
      const handler = createUpdateHoldingHandler(mockHoldingsService);
      mockRequest.params = { id: 'holding-1' };
      mockRequest.body = { quantity: 2, averageCost: 55000 };
      const updatedHolding = { ...mockHolding, quantity: new Decimal(2) };
      mockHoldingsService.updateHolding.mockResolvedValue(updatedHolding);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockHoldingsService.updateHolding).toHaveBeenCalledWith('holding-1', mockRequest.body);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: updatedHolding,
        message: 'Holding updated successfully',
        timestamp: expect.any(String),
      });
    });

    it('should handle errors by calling next', async () => {
      // Arrange
      const handler = createUpdateHoldingHandler(mockHoldingsService);
      mockRequest.params = { id: 'holding-1' };
      mockRequest.body = { quantity: 2 };
      const error = new Error('Service error');
      mockHoldingsService.updateHolding.mockRejectedValue(error);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Delete Holding
  // ============================================================

  describe('createDeleteHoldingHandler', () => {
    it('should delete holding successfully', async () => {
      // Arrange
      const handler = createDeleteHoldingHandler(mockHoldingsService);
      mockRequest.params = { id: 'holding-1' };
      mockHoldingsService.deleteHolding.mockResolvedValue(undefined);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockHoldingsService.deleteHolding).toHaveBeenCalledWith('holding-1');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle errors by calling next', async () => {
      // Arrange
      const handler = createDeleteHoldingHandler(mockHoldingsService);
      mockRequest.params = { id: 'holding-1' };
      const error = new Error('Service error');
      mockHoldingsService.deleteHolding.mockRejectedValue(error);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.send).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Get Transactions
  // ============================================================

  describe('createGetTransactionsHandler', () => {
    const mockPaginatedResponse = {
      data: [mockTransaction],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    it('should return transactions with default pagination', async () => {
      // Arrange
      const handler = createGetTransactionsHandler(mockTransactionService);
      mockRequest.params = { id: 'holding-1' };
      mockRequest.query = {};
      mockTransactionService.getTransactions.mockResolvedValue(mockPaginatedResponse);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockTransactionService.getTransactions).toHaveBeenCalledWith('holding-1', {
        page: 1,
        limit: 10,
        sortBy: 'date',
        order: 'desc',
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [mockTransaction],
        pagination: mockPaginatedResponse.pagination,
        timestamp: expect.any(String),
      });
    });

    it('should handle custom pagination parameters', async () => {
      // Arrange
      const handler = createGetTransactionsHandler(mockTransactionService);
      mockRequest.params = { id: 'holding-1' };
      mockRequest.query = {
        page: '2',
        limit: '20',
        sortBy: 'quantity',
        order: 'asc',
      };
      mockTransactionService.getTransactions.mockResolvedValue(mockPaginatedResponse);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockTransactionService.getTransactions).toHaveBeenCalledWith('holding-1', {
        page: 2,
        limit: 20,
        sortBy: 'quantity',
        order: 'asc',
      });
    });

    it('should parse numeric query parameters correctly', async () => {
      // Arrange
      const handler = createGetTransactionsHandler(mockTransactionService);
      mockRequest.params = { id: 'holding-1' };
      mockRequest.query = { page: '3', limit: '5' };
      mockTransactionService.getTransactions.mockResolvedValue(mockPaginatedResponse);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockTransactionService.getTransactions).toHaveBeenCalledWith('holding-1', {
        page: 3,
        limit: 5,
        sortBy: 'date',
        order: 'desc',
      });
    });

    it('should handle errors by calling next', async () => {
      // Arrange
      const handler = createGetTransactionsHandler(mockTransactionService);
      mockRequest.params = { id: 'holding-1' };
      const error = new Error('Service error');
      mockTransactionService.getTransactions.mockRejectedValue(error);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Add Transaction
  // ============================================================

  describe('createAddTransactionHandler', () => {
    it('should add transaction successfully', async () => {
      // Arrange
      const handler = createAddTransactionHandler(mockTransactionService);
      mockRequest.params = { id: 'holding-1' };
      mockRequest.body = {
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 50000,
        date: '2024-01-01',
      };
      mockTransactionService.addTransaction.mockResolvedValue(mockTransaction);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockTransactionService.addTransaction).toHaveBeenCalledWith('holding-1', mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockTransaction,
        message: 'Transaction added successfully',
        timestamp: expect.any(String),
      });
    });

    it('should handle errors by calling next', async () => {
      // Arrange
      const handler = createAddTransactionHandler(mockTransactionService);
      mockRequest.params = { id: 'holding-1' };
      mockRequest.body = { type: 'BUY', quantity: 1 };
      const error = new Error('Service error');
      mockTransactionService.addTransaction.mockRejectedValue(error);

      // Act
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Create Holdings Handlers
  // ============================================================

  describe('createHoldingsHandlers', () => {
    it('should create all handlers correctly', () => {
      // Act
      const handlers = createHoldingsHandlers(mockHoldingsService, mockTransactionService);

      // Assert
      expect(handlers.getHoldings).toBeDefined();
      expect(handlers.addHolding).toBeDefined();
      expect(handlers.getHoldingById).toBeDefined();
      expect(handlers.updateHolding).toBeDefined();
      expect(handlers.deleteHolding).toBeDefined();
      expect(handlers.getTransactions).toBeDefined();
      expect(handlers.addTransaction).toBeDefined();
      expect(typeof handlers.getHoldings).toBe('function');
      expect(typeof handlers.addHolding).toBe('function');
      expect(typeof handlers.getHoldingById).toBe('function');
      expect(typeof handlers.updateHolding).toBe('function');
      expect(typeof handlers.deleteHolding).toBe('function');
      expect(typeof handlers.getTransactions).toBe('function');
      expect(typeof handlers.addTransaction).toBe('function');
    });
  });
});
