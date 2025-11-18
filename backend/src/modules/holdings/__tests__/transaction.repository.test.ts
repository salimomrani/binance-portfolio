/**
 * Integration tests for TransactionRepository
 * Tests all database operations with real Prisma client
 * Target coverage: 90%+
 * T024: Transaction repository integration tests
 */

import { PrismaClient, TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';
import { createTransactionRepository, TransactionRepository } from '../transaction.repository';
import { createTestPrismaClient, cleanupDatabase, createTestUser } from '../../../../tests/helpers';

describe('TransactionRepository', () => {
  let prisma: PrismaClient;
  let repository: TransactionRepository;
  let testUserId: string;
  let testPortfolioId: string;
  let testHoldingId: string;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    repository = createTransactionRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);
    // Create test user, portfolio, and holding
    const user = await createTestUser(prisma, { id: 'test-user-tx' });
    testUserId = user.id;

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: testUserId,
        name: 'Test Portfolio',
      },
    });
    testPortfolioId = portfolio.id;

    const holding = await prisma.holding.create({
      data: {
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: new Decimal(1),
        averageCost: new Decimal(50000),
      },
    });
    testHoldingId = holding.id;
  });

  // ============================================================
  // Query Operations
  // ============================================================

  describe('findAll', () => {
    it('should return empty array when no transactions exist', async () => {
      const result = await repository.findAll(testHoldingId);
      expect(result).toEqual([]);
    });

    it('should find all transactions for a holding', async () => {
      // Arrange
      await prisma.transaction.createMany({
        data: [
          {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(0.5),
            pricePerUnit: new Decimal(48000),
            totalCost: new Decimal(24000),
            fee: new Decimal(0),
            date: new Date('2024-01-01'),
          },
          {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(0.5),
            pricePerUnit: new Decimal(52000),
            totalCost: new Decimal(26000),
            fee: new Decimal(0),
            date: new Date('2024-01-02'),
          },
        ],
      });

      // Act
      const result = await repository.findAll(testHoldingId);

      // Assert
      expect(result).toHaveLength(2);
    });

    it('should sort transactions by specified field', async () => {
      // Arrange
      await prisma.transaction.createMany({
        data: [
          {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(2),
            pricePerUnit: new Decimal(50000),
            totalCost: new Decimal(100000),
            fee: new Decimal(0),
            date: new Date('2024-01-02'),
          },
          {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(1),
            pricePerUnit: new Decimal(45000),
            totalCost: new Decimal(45000),
            fee: new Decimal(0),
            date: new Date('2024-01-01'),
          },
        ],
      });

      // Act
      const result = await repository.findAll(testHoldingId, 'date', 'asc');

      // Assert
      expect(result[0].date < result[1].date).toBe(true);
    });

    it('should paginate results', async () => {
      // Arrange
      for (let i = 0; i < 15; i++) {
        await prisma.transaction.create({
          data: {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(0.1),
            pricePerUnit: new Decimal(50000),
            totalCost: new Decimal(5000),
            fee: new Decimal(0),
            date: new Date(),
          },
        });
      }

      // Act
      const page1 = await repository.findAll(testHoldingId, 'date', 'desc', 0, 10);
      const page2 = await repository.findAll(testHoldingId, 'date', 'desc', 10, 10);

      // Assert
      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(5);
    });
  });

  describe('findById', () => {
    it('should return null when transaction not found', async () => {
      const result = await repository.findById('non-existent');
      expect(result).toBeNull();
    });

    it('should find transaction by ID', async () => {
      // Arrange
      const transaction = await prisma.transaction.create({
        data: {
          holdingId: testHoldingId,
          type: 'BUY',
          quantity: new Decimal(1),
          pricePerUnit: new Decimal(50000),
          totalCost: new Decimal(50000),
          fee: new Decimal(0),
          date: new Date(),
        },
      });

      // Act
      const result = await repository.findById(transaction.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(transaction.id);
      expect(result!.type).toBe('BUY');
    });
  });

  describe('findByDateRange', () => {
    it('should return empty array when no transactions in range', async () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      const result = await repository.findByDateRange(testHoldingId, start, end);
      expect(result).toEqual([]);
    });

    it('should find transactions within date range', async () => {
      // Arrange
      await prisma.transaction.createMany({
        data: [
          {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(1),
            pricePerUnit: new Decimal(50000),
            totalCost: new Decimal(50000),
            fee: new Decimal(0),
            date: new Date('2024-01-15'),
          },
          {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(1),
            pricePerUnit: new Decimal(51000),
            totalCost: new Decimal(51000),
            fee: new Decimal(0),
            date: new Date('2024-02-15'),
          },
          {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(1),
            pricePerUnit: new Decimal(52000),
            totalCost: new Decimal(52000),
            fee: new Decimal(0),
            date: new Date('2024-03-15'),
          },
        ],
      });

      // Act
      const result = await repository.findByDateRange(
        testHoldingId,
        new Date('2024-01-01'),
        new Date('2024-02-28')
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(new Decimal(result[0].pricePerUnit).toNumber()).toBe(50000);
      expect(new Decimal(result[1].pricePerUnit).toNumber()).toBe(51000);
    });
  });

  describe('count', () => {
    it('should return 0 when no transactions exist', async () => {
      const count = await repository.count(testHoldingId);
      expect(count).toBe(0);
    });

    it('should count all transactions for a holding', async () => {
      // Arrange
      await prisma.transaction.createMany({
        data: [
          {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(1),
            pricePerUnit: new Decimal(50000),
            totalCost: new Decimal(50000),
            fee: new Decimal(0),
            date: new Date(),
          },
          {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(1),
            pricePerUnit: new Decimal(51000),
            totalCost: new Decimal(51000),
            fee: new Decimal(0),
            date: new Date(),
          },
        ],
      });

      // Act
      const count = await repository.count(testHoldingId);

      // Assert
      expect(count).toBe(2);
    });
  });

  // ============================================================
  // Create Operations
  // ============================================================

  describe('create', () => {
    it('should create a BUY transaction', async () => {
      // Act
      const transaction = await repository.create({
        holdingId: testHoldingId,
        type: 'BUY' as TransactionType,
        quantity: new Decimal(1),
        pricePerUnit: new Decimal(50000),
        totalCost: new Decimal(50100),
        fee: new Decimal(100),
        date: new Date(),
      });

      // Assert
      expect(transaction.id).toBeDefined();
      expect(transaction.type).toBe('BUY');
      expect(new Decimal(transaction.quantity).toNumber()).toBe(1);
      expect(new Decimal(transaction.pricePerUnit).toNumber()).toBe(50000);
      expect(new Decimal(transaction.totalCost).toNumber()).toBe(50100);
      expect(new Decimal(transaction.fee).toNumber()).toBe(100);
    });

    it('should create a SELL transaction', async () => {
      // Act
      const transaction = await repository.create({
        holdingId: testHoldingId,
        type: 'SELL' as TransactionType,
        quantity: new Decimal(0.5),
        pricePerUnit: new Decimal(55000),
        totalCost: new Decimal(27450),
        fee: new Decimal(50),
        date: new Date(),
      });

      // Assert
      expect(transaction.type).toBe('SELL');
      expect(new Decimal(transaction.quantity).toNumber()).toBe(0.5);
    });

    it('should create transaction with notes', async () => {
      // Act
      const transaction = await repository.create({
        holdingId: testHoldingId,
        type: 'BUY' as TransactionType,
        quantity: new Decimal(1),
        pricePerUnit: new Decimal(50000),
        totalCost: new Decimal(50000),
        fee: new Decimal(0),
        date: new Date(),
        notes: 'Test transaction',
      });

      // Assert
      expect(transaction.notes).toBe('Test transaction');
    });
  });

  // ============================================================
  // Update Operations
  // ============================================================

  describe('update', () => {
    it('should update transaction quantity', async () => {
      // Arrange
      const transaction = await prisma.transaction.create({
        data: {
          holdingId: testHoldingId,
          type: 'BUY',
          quantity: new Decimal(1),
          pricePerUnit: new Decimal(50000),
          totalCost: new Decimal(50000),
          fee: new Decimal(0),
          date: new Date(),
        },
      });

      // Act
      const updated = await repository.update(transaction.id, {
        quantity: new Decimal(2),
      });

      // Assert
      expect(new Decimal(updated.quantity).toNumber()).toBe(2);
      expect(new Decimal(updated.totalCost).toNumber()).toBe(100000); // Recalculated
    });

    it('should update transaction price and recalculate total', async () => {
      // Arrange
      const transaction = await prisma.transaction.create({
        data: {
          holdingId: testHoldingId,
          type: 'BUY',
          quantity: new Decimal(1),
          pricePerUnit: new Decimal(50000),
          totalCost: new Decimal(50000),
          fee: new Decimal(0),
          date: new Date(),
        },
      });

      // Act
      const updated = await repository.update(transaction.id, {
        pricePerUnit: new Decimal(55000),
      });

      // Assert
      expect(new Decimal(updated.pricePerUnit).toNumber()).toBe(55000);
      expect(new Decimal(updated.totalCost).toNumber()).toBe(55000); // Recalculated
    });

    it('should update transaction notes', async () => {
      // Arrange
      const transaction = await prisma.transaction.create({
        data: {
          holdingId: testHoldingId,
          type: 'BUY',
          quantity: new Decimal(1),
          pricePerUnit: new Decimal(50000),
          totalCost: new Decimal(50000),
          fee: new Decimal(0),
          date: new Date(),
        },
      });

      // Act
      const updated = await repository.update(transaction.id, {
        notes: 'Updated notes',
      });

      // Assert
      expect(updated.notes).toBe('Updated notes');
    });
  });

  // ============================================================
  // Delete Operations
  // ============================================================

  describe('delete', () => {
    it('should delete transaction', async () => {
      // Arrange
      const transaction = await prisma.transaction.create({
        data: {
          holdingId: testHoldingId,
          type: 'BUY',
          quantity: new Decimal(1),
          pricePerUnit: new Decimal(50000),
          totalCost: new Decimal(50000),
          fee: new Decimal(0),
          date: new Date(),
        },
      });

      // Act
      await repository.delete(transaction.id);

      // Assert
      const found = await repository.findById(transaction.id);
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent transaction', async () => {
      await expect(repository.delete('non-existent')).rejects.toThrow();
    });
  });

  // ============================================================
  // Aggregate Operations
  // ============================================================

  describe('getTotalInvested', () => {
    it('should return 0 when no BUY transactions exist', async () => {
      const total = await repository.getTotalInvested(testHoldingId);
      expect(total).toBe(0);
    });

    it('should calculate total invested from BUY transactions only', async () => {
      // Arrange
      await prisma.transaction.createMany({
        data: [
          {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(1),
            pricePerUnit: new Decimal(50000),
            totalCost: new Decimal(50100),
            fee: new Decimal(100),
            date: new Date('2024-01-01'),
          },
          {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(1),
            pricePerUnit: new Decimal(51000),
            totalCost: new Decimal(51200),
            fee: new Decimal(200),
            date: new Date('2024-01-02'),
          },
          {
            holdingId: testHoldingId,
            type: 'SELL',
            quantity: new Decimal(0.5),
            pricePerUnit: new Decimal(55000),
            totalCost: new Decimal(27500),
            fee: new Decimal(0),
            date: new Date('2024-01-03'),
          },
        ],
      });

      // Act
      const total = await repository.getTotalInvested(testHoldingId);

      // Assert
      // Only BUY transactions: 50100 + 51200 = 101300
      expect(total).toBe(101300);
    });
  });

  describe('getAveragePrice', () => {
    it('should return 0 when no transactions exist', async () => {
      const avg = await repository.getAveragePrice(testHoldingId);
      expect(avg).toBe(0);
    });

    it('should calculate weighted average price from BUY transactions', async () => {
      // Arrange
      await prisma.transaction.createMany({
        data: [
          {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(1),
            pricePerUnit: new Decimal(50000),
            totalCost: new Decimal(50000),
            fee: new Decimal(0),
            date: new Date(),
          },
          {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(1),
            pricePerUnit: new Decimal(60000),
            totalCost: new Decimal(60000),
            fee: new Decimal(0),
            date: new Date(),
          },
        ],
      });

      // Act
      const avg = await repository.getAveragePrice(testHoldingId);

      // Assert
      // (1 * 50000 + 1 * 60000) / (1 + 1) = 110000 / 2 = 55000
      expect(avg).toBe(55000);
    });

    it('should ignore SELL transactions when calculating average', async () => {
      // Arrange
      await prisma.transaction.createMany({
        data: [
          {
            holdingId: testHoldingId,
            type: 'BUY',
            quantity: new Decimal(2),
            pricePerUnit: new Decimal(50000),
            totalCost: new Decimal(100000),
            fee: new Decimal(0),
            date: new Date(),
          },
          {
            holdingId: testHoldingId,
            type: 'SELL',
            quantity: new Decimal(1),
            pricePerUnit: new Decimal(70000),
            totalCost: new Decimal(70000),
            fee: new Decimal(0),
            date: new Date(),
          },
        ],
      });

      // Act
      const avg = await repository.getAveragePrice(testHoldingId);

      // Assert
      // Only BUY: (2 * 50000) / 2 = 50000
      expect(avg).toBe(50000);
    });
  });
});
