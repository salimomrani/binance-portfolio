/**
 * Integration tests for HoldingsRepository
 * Tests all database operations with real Prisma client
 * Target coverage: 90%+
 * T023: Holdings repository integration tests
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { createHoldingsRepository, HoldingsRepository } from '../holdings.repository';
import { createTestPrismaClient, cleanupDatabase, createTestUser } from '../../../../tests/helpers';

describe('HoldingsRepository', () => {
  let prisma: PrismaClient;
  let repository: HoldingsRepository;
  let testUserId: string;
  let testPortfolioId: string;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    repository = createHoldingsRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);
    // Create test user and portfolio
    const user = await createTestUser(prisma, { id: 'test-user-holdings' });
    testUserId = user.id;

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: testUserId,
        name: 'Test Portfolio',
        description: 'Test Description',
      },
    });
    testPortfolioId = portfolio.id;
  });

  // ============================================================
  // Query Operations
  // ============================================================

  describe('findAll', () => {
    it('should return empty array when portfolio has no holdings', async () => {
      const result = await repository.findAll(testPortfolioId);
      expect(result).toEqual([]);
    });

    it('should find all holdings for a portfolio', async () => {
      // Arrange
      await prisma.holding.create({
        data: {
          portfolioId: testPortfolioId,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: new Decimal(1.5),
          averageCost: new Decimal(50000),
        },
      });
      await prisma.holding.create({
        data: {
          portfolioId: testPortfolioId,
          symbol: 'ETH',
          name: 'Ethereum',
          quantity: new Decimal(10),
          averageCost: new Decimal(3000),
        },
      });

      // Act
      const result = await repository.findAll(testPortfolioId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('BTC');
      expect(result[1].symbol).toBe('ETH');
    });

    it('should sort holdings by symbol when specified', async () => {
      // Arrange
      await prisma.holding.createMany({
        data: [
          {
            portfolioId: testPortfolioId,
            symbol: 'ETH',
            name: 'Ethereum',
            quantity: new Decimal(10),
            averageCost: new Decimal(3000),
          },
          {
            portfolioId: testPortfolioId,
            symbol: 'BTC',
            name: 'Bitcoin',
            quantity: new Decimal(1),
            averageCost: new Decimal(50000),
          },
        ],
      });

      // Act
      const result = await repository.findAll(testPortfolioId, 'symbol', 'asc');

      // Assert
      expect(result[0].symbol).toBe('BTC');
      expect(result[1].symbol).toBe('ETH');
    });
  });

  describe('findById', () => {
    it('should return null when holding not found', async () => {
      const result = await repository.findById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should find holding by ID', async () => {
      // Arrange
      const holding = await prisma.holding.create({
        data: {
          portfolioId: testPortfolioId,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: new Decimal(1.5),
          averageCost: new Decimal(50000),
        },
      });

      // Act
      const result = await repository.findById(holding.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(holding.id);
      expect(result!.symbol).toBe('BTC');
    });
  });

  describe('findBySymbol', () => {
    it('should return null when symbol not found in portfolio', async () => {
      const result = await repository.findBySymbol(testPortfolioId, 'BTC');
      expect(result).toBeNull();
    });

    it('should find holding by symbol within portfolio', async () => {
      // Arrange
      await prisma.holding.create({
        data: {
          portfolioId: testPortfolioId,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: new Decimal(1.5),
          averageCost: new Decimal(50000),
        },
      });

      // Act
      const result = await repository.findBySymbol(testPortfolioId, 'BTC');

      // Assert
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('BTC');
      expect(result!.portfolioId).toBe(testPortfolioId);
    });

    it('should not find holdings from other portfolios', async () => {
      // Arrange: Create another portfolio with same symbol
      const portfolio2 = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Portfolio 2',
        },
      });

      await prisma.holding.create({
        data: {
          portfolioId: portfolio2.id,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: new Decimal(1),
          averageCost: new Decimal(50000),
        },
      });

      // Act
      const result = await repository.findBySymbol(testPortfolioId, 'BTC');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findWithTransactions', () => {
    it('should return null when holding not found', async () => {
      const result = await repository.findWithTransactions('non-existent');
      expect(result).toBeNull();
    });

    it('should find holding with empty transactions array', async () => {
      // Arrange
      const holding = await prisma.holding.create({
        data: {
          portfolioId: testPortfolioId,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: new Decimal(1),
          averageCost: new Decimal(50000),
        },
      });

      // Act
      const result = await repository.findWithTransactions(holding.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.transactions).toEqual([]);
    });

    it('should find holding with transactions included', async () => {
      // Arrange
      const holding = await prisma.holding.create({
        data: {
          portfolioId: testPortfolioId,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: new Decimal(1),
          averageCost: new Decimal(50000),
        },
      });

      await prisma.transaction.create({
        data: {
          holdingId: holding.id,
          type: 'BUY',
          quantity: new Decimal(1),
          pricePerUnit: new Decimal(50000),
          totalCost: new Decimal(50000),
          fee: new Decimal(0),
          date: new Date(),
        },
      });

      // Act
      const result = await repository.findWithTransactions(holding.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.transactions).toHaveLength(1);
      expect(result!.transactions[0].type).toBe('BUY');
    });
  });

  // ============================================================
  // Create Operations
  // ============================================================

  describe('create', () => {
    it('should create a new holding', async () => {
      // Act
      const holding = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: new Decimal(1.5),
        averageCost: new Decimal(50000),
      });

      // Assert
      expect(holding.id).toBeDefined();
      expect(holding.symbol).toBe('BTC');
      expect(holding.name).toBe('Bitcoin');
      expect(new Decimal(holding.quantity).toNumber()).toBe(1.5);
      expect(new Decimal(holding.averageCost).toNumber()).toBe(50000);
    });

    it('should create holding with notes', async () => {
      // Act
      const holding = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: new Decimal(1),
        averageCost: new Decimal(50000),
        notes: 'Test notes',
      });

      // Assert
      expect(holding.notes).toBe('Test notes');
    });

    it('should enforce unique constraint on portfolioId+symbol', async () => {
      // Arrange
      await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: new Decimal(1),
        averageCost: new Decimal(50000),
      });

      // Act & Assert
      await expect(
        repository.create({
          portfolioId: testPortfolioId,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: new Decimal(2),
          averageCost: new Decimal(60000),
        })
      ).rejects.toThrow();
    });
  });

  // ============================================================
  // Update Operations
  // ============================================================

  describe('update', () => {
    it('should update holding quantity', async () => {
      // Arrange
      const holding = await prisma.holding.create({
        data: {
          portfolioId: testPortfolioId,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: new Decimal(1),
          averageCost: new Decimal(50000),
        },
      });

      // Act
      const updated = await repository.update(holding.id, {
        quantity: new Decimal(2),
      });

      // Assert
      expect(new Decimal(updated.quantity).toNumber()).toBe(2);
      expect(new Decimal(updated.averageCost).toNumber()).toBe(50000); // Unchanged
    });

    it('should update holding average cost', async () => {
      // Arrange
      const holding = await prisma.holding.create({
        data: {
          portfolioId: testPortfolioId,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: new Decimal(1),
          averageCost: new Decimal(50000),
        },
      });

      // Act
      const updated = await repository.update(holding.id, {
        averageCost: new Decimal(55000),
      });

      // Assert
      expect(new Decimal(updated.averageCost).toNumber()).toBe(55000);
    });

    it('should update holding notes', async () => {
      // Arrange
      const holding = await prisma.holding.create({
        data: {
          portfolioId: testPortfolioId,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: new Decimal(1),
          averageCost: new Decimal(50000),
        },
      });

      // Act
      const updated = await repository.update(holding.id, {
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
    it('should delete holding', async () => {
      // Arrange
      const holding = await prisma.holding.create({
        data: {
          portfolioId: testPortfolioId,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: new Decimal(1),
          averageCost: new Decimal(50000),
        },
      });

      // Act
      await repository.delete(holding.id);

      // Assert
      const found = await repository.findById(holding.id);
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent holding', async () => {
      await expect(repository.delete('non-existent')).rejects.toThrow();
    });
  });

  // ============================================================
  // Aggregate Operations
  // ============================================================

  describe('getTotalValue', () => {
    it('should return 0 for portfolio with no holdings', async () => {
      const total = await repository.getTotalValue(testPortfolioId);
      expect(total).toBe(0);
    });

    it('should calculate total value based on quantity * averageCost', async () => {
      // Arrange
      await prisma.holding.createMany({
        data: [
          {
            portfolioId: testPortfolioId,
            symbol: 'BTC',
            name: 'Bitcoin',
            quantity: new Decimal(2),
            averageCost: new Decimal(50000),
          },
          {
            portfolioId: testPortfolioId,
            symbol: 'ETH',
            name: 'Ethereum',
            quantity: new Decimal(10),
            averageCost: new Decimal(3000),
          },
        ],
      });

      // Act
      const total = await repository.getTotalValue(testPortfolioId);

      // Assert
      // (2 * 50000) + (10 * 3000) = 100000 + 30000 = 130000
      expect(total).toBe(130000);
    });
  });

  describe('getSymbols', () => {
    it('should return empty array for portfolio with no holdings', async () => {
      const symbols = await repository.getSymbols(testPortfolioId);
      expect(symbols).toEqual([]);
    });

    it('should return all unique symbols in portfolio', async () => {
      // Arrange
      await prisma.holding.createMany({
        data: [
          {
            portfolioId: testPortfolioId,
            symbol: 'BTC',
            name: 'Bitcoin',
            quantity: new Decimal(1),
            averageCost: new Decimal(50000),
          },
          {
            portfolioId: testPortfolioId,
            symbol: 'ETH',
            name: 'Ethereum',
            quantity: new Decimal(10),
            averageCost: new Decimal(3000),
          },
        ],
      });

      // Act
      const symbols = await repository.getSymbols(testPortfolioId);

      // Assert
      expect(symbols).toEqual(['BTC', 'ETH']);
    });
  });
});
