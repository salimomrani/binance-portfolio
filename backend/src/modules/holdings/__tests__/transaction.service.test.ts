/**
 * Unit tests for TransactionService
 * Tests business logic with mocked dependencies
 * Target coverage: 95%+
 * T028: Transaction service unit tests
 */

import { Transaction, TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';
import { createTransactionService, TransactionService } from '../transaction.service';
import { TransactionRepository } from '../transaction.repository';
import { HoldingsRepository } from '../holdings.repository';
import { AddTransactionInput } from '../transaction.validation';

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('TransactionService', () => {
  let service: TransactionService;
  let mockTransactionRepo: jest.Mocked<TransactionRepository>;
  let mockHoldingsRepo: jest.Mocked<HoldingsRepository>;

  const mockHolding = {
    id: 'holding-1',
    portfolioId: 'portfolio-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    quantity: new Decimal(10),
    averageCost: new Decimal(50000),
    notes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    transactions: [],
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

    // Create mock transaction repository
    mockTransactionRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByDateRange: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      getTotalInvested: jest.fn(),
      getAveragePrice: jest.fn(),
    } as any;

    // Create mock holdings repository
    mockHoldingsRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySymbol: jest.fn(),
      findWithTransactions: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getTotalValue: jest.fn(),
      getSymbols: jest.fn(),
    } as any;

    // Create service instance using factory function
    service = createTransactionService(mockTransactionRepo, mockHoldingsRepo);
  });

  // ============================================================
  // Add Transaction
  // ============================================================

  describe('addTransaction', () => {
    const buyTransactionInput: AddTransactionInput = {
      type: 'BUY',
      quantity: 1,
      pricePerUnit: 50000,
      fee: 10,
      date: '2024-01-01',
      notes: 'Test transaction',
    };

    beforeEach(() => {
      mockHoldingsRepo.findWithTransactions.mockResolvedValue(mockHolding);
      mockTransactionRepo.create.mockResolvedValue(mockTransaction);
      mockHoldingsRepo.update.mockResolvedValue(mockHolding);
    });

    it('should add a BUY transaction successfully', async () => {
      // Act
      const result = await service.addTransaction('holding-1', buyTransactionInput);

      // Assert
      expect(result).toEqual(mockTransaction);
      expect(mockHoldingsRepo.findWithTransactions).toHaveBeenCalledWith('holding-1');
      expect(mockTransactionRepo.create).toHaveBeenCalledWith({
        holdingId: 'holding-1',
        type: TransactionType.BUY,
        quantity: new Decimal(1),
        pricePerUnit: new Decimal(50000),
        totalCost: new Decimal(50010), // 1 * 50000 + 10 fee
        fee: new Decimal(10),
        date: new Date('2024-01-01'),
        notes: 'Test transaction',
      });
    });

    it('should calculate total cost with fee', async () => {
      // Arrange
      const inputWithFee = { ...buyTransactionInput, fee: 100 };

      // Act
      await service.addTransaction('holding-1', inputWithFee);

      // Assert
      expect(mockTransactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalCost: new Decimal(50100), // 1 * 50000 + 100 fee
        })
      );
    });

    it('should calculate total cost without fee', async () => {
      // Arrange
      const inputWithoutFee = { ...buyTransactionInput, fee: undefined };

      // Act
      await service.addTransaction('holding-1', inputWithoutFee);

      // Assert
      expect(mockTransactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalCost: new Decimal(50000), // 1 * 50000
          fee: new Decimal(0),
        })
      );
    });

    it('should throw error if holding not found', async () => {
      // Arrange
      mockHoldingsRepo.findWithTransactions.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addTransaction('holding-1', buyTransactionInput)).rejects.toThrow(
        'Holding with ID holding-1 not found'
      );
      expect(mockTransactionRepo.create).not.toHaveBeenCalled();
    });

    it('should add a SELL transaction successfully', async () => {
      // Arrange
      const sellInput: AddTransactionInput = {
        type: 'SELL',
        quantity: 2,
        pricePerUnit: 55000,
        fee: 10,
        date: '2024-01-02',
      };

      // Act
      const result = await service.addTransaction('holding-1', sellInput);

      // Assert
      expect(result).toEqual(mockTransaction);
      expect(mockTransactionRepo.create).toHaveBeenCalledWith({
        holdingId: 'holding-1',
        type: TransactionType.SELL,
        quantity: new Decimal(2),
        pricePerUnit: new Decimal(55000),
        totalCost: new Decimal(110010), // 2 * 55000 + 10 fee
        fee: new Decimal(10),
        date: new Date('2024-01-02'),
        notes: undefined,
      });
    });

    it('should throw error when selling more than available quantity', async () => {
      // Arrange
      const sellInput: AddTransactionInput = {
        type: 'SELL',
        quantity: 20, // More than available (10)
        pricePerUnit: 55000,
        date: '2024-01-02',
      };

      // Act & Assert
      await expect(service.addTransaction('holding-1', sellInput)).rejects.toThrow(
        'Cannot sell 20 units. Only 10 units available.'
      );
      expect(mockTransactionRepo.create).not.toHaveBeenCalled();
    });

    it('should recalculate holding average cost after adding transaction', async () => {
      // Arrange
      const holdingWithTransactions = {
        ...mockHolding,
        transactions: [
          {
            ...mockTransaction,
            type: TransactionType.BUY,
            quantity: new Decimal(5),
            pricePerUnit: new Decimal(40000),
          },
          {
            ...mockTransaction,
            id: 'transaction-2',
            type: TransactionType.BUY,
            quantity: new Decimal(5),
            pricePerUnit: new Decimal(60000),
          },
        ],
      };
      mockHoldingsRepo.findWithTransactions.mockResolvedValue(holdingWithTransactions);

      // Act
      await service.addTransaction('holding-1', buyTransactionInput);

      // Assert
      expect(mockHoldingsRepo.update).toHaveBeenCalledWith(
        'holding-1',
        expect.objectContaining({
          quantity: expect.any(Decimal),
          averageCost: expect.any(Decimal),
        })
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockTransactionRepo.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.addTransaction('holding-1', buyTransactionInput)).rejects.toThrow('Database error');
    });
  });

  // ============================================================
  // Get Transactions
  // ============================================================

  describe('getTransactions', () => {
    const mockTransactions = [
      mockTransaction,
      { ...mockTransaction, id: 'transaction-2', type: TransactionType.SELL },
      { ...mockTransaction, id: 'transaction-3', type: TransactionType.BUY },
    ];

    beforeEach(() => {
      mockTransactionRepo.count.mockResolvedValue(3);
      mockTransactionRepo.findAll.mockResolvedValue(mockTransactions);
    });

    it('should return paginated transactions with default options', async () => {
      // Act
      const result = await service.getTransactions('holding-1');

      // Assert
      expect(result.data).toEqual(mockTransactions);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
      expect(mockTransactionRepo.count).toHaveBeenCalledWith('holding-1');
      expect(mockTransactionRepo.findAll).toHaveBeenCalledWith('holding-1', 'date', 'desc', 0, 10);
    });

    it('should handle custom pagination options', async () => {
      // Arrange
      const options = {
        page: 2,
        limit: 5,
        sortBy: 'quantity' as const,
        order: 'asc' as const,
      };

      // Act
      const result = await service.getTransactions('holding-1', options);

      // Assert
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 3,
        totalPages: 1,
        hasNext: false,
        hasPrev: true,
      });
      expect(mockTransactionRepo.findAll).toHaveBeenCalledWith('holding-1', 'quantity', 'asc', 5, 5);
    });

    it('should calculate hasNext correctly', async () => {
      // Arrange
      mockTransactionRepo.count.mockResolvedValue(25);
      const options = { page: 1, limit: 10 };

      // Act
      const result = await service.getTransactions('holding-1', options);

      // Assert
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      });
    });

    it('should calculate hasPrev correctly', async () => {
      // Arrange
      mockTransactionRepo.count.mockResolvedValue(25);
      const options = { page: 2, limit: 10 };

      // Act
      const result = await service.getTransactions('holding-1', options);

      // Assert
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('should handle empty transaction list', async () => {
      // Arrange
      mockTransactionRepo.count.mockResolvedValue(0);
      mockTransactionRepo.findAll.mockResolvedValue([]);

      // Act
      const result = await service.getTransactions('holding-1');

      // Assert
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockTransactionRepo.count.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getTransactions('holding-1')).rejects.toThrow('Database error');
    });
  });

  // ============================================================
  // Update Holding Average Cost
  // ============================================================

  describe('updateHoldingAverageCost', () => {
    it('should recalculate average cost from BUY transactions', async () => {
      // Arrange
      const holdingWithTransactions = {
        ...mockHolding,
        transactions: [
          {
            ...mockTransaction,
            type: TransactionType.BUY,
            quantity: new Decimal(5),
            pricePerUnit: new Decimal(40000),
          },
          {
            ...mockTransaction,
            id: 'transaction-2',
            type: TransactionType.BUY,
            quantity: new Decimal(5),
            pricePerUnit: new Decimal(60000),
          },
        ],
      };
      mockHoldingsRepo.findWithTransactions.mockResolvedValue(holdingWithTransactions);
      mockHoldingsRepo.update.mockResolvedValue(mockHolding);

      // Act
      await service.updateHoldingAverageCost('holding-1');

      // Assert
      // Total cost: (5 * 40000) + (5 * 60000) = 500000
      // Total quantity: 10
      // Average cost: 500000 / 10 = 50000
      expect(mockHoldingsRepo.update).toHaveBeenCalledWith('holding-1', {
        quantity: new Decimal(10),
        averageCost: new Decimal(50000),
      });
    });

    it('should handle BUY and SELL transactions correctly', async () => {
      // Arrange
      const holdingWithTransactions = {
        ...mockHolding,
        transactions: [
          {
            ...mockTransaction,
            type: TransactionType.BUY,
            quantity: new Decimal(10),
            pricePerUnit: new Decimal(50000),
          },
          {
            ...mockTransaction,
            id: 'transaction-2',
            type: TransactionType.SELL,
            quantity: new Decimal(5),
            pricePerUnit: new Decimal(60000),
          },
        ],
      };
      mockHoldingsRepo.findWithTransactions.mockResolvedValue(holdingWithTransactions);
      mockHoldingsRepo.update.mockResolvedValue(mockHolding);

      // Act
      await service.updateHoldingAverageCost('holding-1');

      // Assert
      // Initial: 10 @ 50000 = 500000 total cost
      // After SELL: 5 @ 50000 (average cost remains same, quantity reduced)
      // Total cost: 250000, Total quantity: 5
      expect(mockHoldingsRepo.update).toHaveBeenCalledWith('holding-1', {
        quantity: new Decimal(5),
        averageCost: new Decimal(50000),
      });
    });

    it('should handle empty transactions list', async () => {
      // Arrange
      mockHoldingsRepo.findWithTransactions.mockResolvedValue({
        ...mockHolding,
        transactions: [],
      });

      // Act
      await service.updateHoldingAverageCost('holding-1');

      // Assert
      // Should not update holding if no transactions
      expect(mockHoldingsRepo.update).not.toHaveBeenCalled();
    });

    it('should throw error if holding not found', async () => {
      // Arrange
      mockHoldingsRepo.findWithTransactions.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateHoldingAverageCost('holding-1')).rejects.toThrow(
        'Holding with ID holding-1 not found'
      );
    });

    it('should handle all units sold', async () => {
      // Arrange
      const holdingWithTransactions = {
        ...mockHolding,
        transactions: [
          {
            ...mockTransaction,
            type: TransactionType.BUY,
            quantity: new Decimal(10),
            pricePerUnit: new Decimal(50000),
          },
          {
            ...mockTransaction,
            id: 'transaction-2',
            type: TransactionType.SELL,
            quantity: new Decimal(10),
            pricePerUnit: new Decimal(60000),
          },
        ],
      };
      mockHoldingsRepo.findWithTransactions.mockResolvedValue(holdingWithTransactions);
      mockHoldingsRepo.update.mockResolvedValue(mockHolding);

      // Act
      await service.updateHoldingAverageCost('holding-1');

      // Assert
      expect(mockHoldingsRepo.update).toHaveBeenCalledWith('holding-1', {
        quantity: new Decimal(0),
        averageCost: new Decimal(0),
      });
    });
  });

  // ============================================================
  // Delete Transaction
  // ============================================================

  describe('deleteTransaction', () => {
    beforeEach(() => {
      mockTransactionRepo.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepo.delete.mockResolvedValue(undefined);
      mockHoldingsRepo.findWithTransactions.mockResolvedValue({
        ...mockHolding,
        transactions: [],
      });
    });

    it('should delete transaction and recalculate average cost', async () => {
      // Act
      await service.deleteTransaction('transaction-1');

      // Assert
      expect(mockTransactionRepo.findById).toHaveBeenCalledWith('transaction-1');
      expect(mockTransactionRepo.delete).toHaveBeenCalledWith('transaction-1');
      expect(mockHoldingsRepo.findWithTransactions).toHaveBeenCalledWith('holding-1');
    });

    it('should throw error if transaction not found', async () => {
      // Arrange
      mockTransactionRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteTransaction('transaction-1')).rejects.toThrow(
        'Transaction with ID transaction-1 not found'
      );
      expect(mockTransactionRepo.delete).not.toHaveBeenCalled();
    });

    it('should recalculate holding after deletion', async () => {
      // Arrange
      const holdingWithTransactions = {
        ...mockHolding,
        transactions: [
          {
            ...mockTransaction,
            id: 'transaction-2',
            type: TransactionType.BUY,
            quantity: new Decimal(5),
            pricePerUnit: new Decimal(50000),
          },
        ],
      };
      mockHoldingsRepo.findWithTransactions.mockResolvedValue(holdingWithTransactions);
      mockHoldingsRepo.update.mockResolvedValue(mockHolding);

      // Act
      await service.deleteTransaction('transaction-1');

      // Assert
      expect(mockHoldingsRepo.update).toHaveBeenCalledWith(
        'holding-1',
        expect.objectContaining({
          quantity: expect.any(Decimal),
          averageCost: expect.any(Decimal),
        })
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockTransactionRepo.delete.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.deleteTransaction('transaction-1')).rejects.toThrow('Database error');
    });
  });
});
