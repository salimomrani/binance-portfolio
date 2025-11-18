/**
 * T023: Holdings Repository Integration Tests
 * Tests with real database (90%+ coverage target)
 *
 * Tests verify:
 * - CRUD operations work correctly
 * - Unique constraints enforced
 * - Relationships with transactions
 * - Cascade deletes
 * - Aggregate calculations
 */

import { PrismaClient } from '@prisma/client';
import { createHoldingsRepository, HoldingsRepository } from '../holdings.repository';

const prisma = new PrismaClient();

describe('HoldingsRepository Integration Tests', () => {
  let repository: HoldingsRepository;
  let testPortfolioId: string;
  let testUserId: string;

  beforeAll(async () => {
    await prisma.$connect();
    repository = createHoldingsRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database in correct order (children first)
    await prisma.transaction.deleteMany();
    await prisma.holding.deleteMany();
    await prisma.portfolio.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-holdings@example.com',
        passwordHash: 'hash123',
      },
    });
    testUserId = user.id;

    // Create test portfolio
    const portfolio = await prisma.portfolio.create({
      data: {
        name: 'Test Portfolio',
        userId: testUserId,
      },
    });
    testPortfolioId = portfolio.id;
  });

  describe('create', () => {
    it('should create a holding', async () => {
      const holding = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1.5,
        averageCost: 45000,
      });

      expect(holding.id).toBeDefined();
      expect(holding.symbol).toBe('BTC');
      expect(holding.name).toBe('Bitcoin');
      expect(holding.quantity).toBe('1.50000000');
      expect(holding.averageCost).toBe('45000.00000000');
      expect(holding.portfolioId).toBe(testPortfolioId);
      expect(holding.createdAt).toBeInstanceOf(Date);
      expect(holding.updatedAt).toBeInstanceOf(Date);
    });

    it('should create holding with optional notes', async () => {
      const holding = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'ETH',
        name: 'Ethereum',
        quantity: 10,
        averageCost: 3000,
        notes: 'Long-term hold',
      });

      expect(holding.notes).toBe('Long-term hold');
    });

    it('should enforce unique constraint on portfolioId + symbol', async () => {
      await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      await expect(
        repository.create({
          portfolioId: testPortfolioId,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: 2,
          averageCost: 50000,
        })
      ).rejects.toThrow(/already exists/);
    });

    it('should allow same symbol in different portfolios', async () => {
      // Create second portfolio
      const portfolio2 = await prisma.portfolio.create({
        data: {
          name: 'Portfolio 2',
          userId: testUserId,
        },
      });

      const holding1 = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      const holding2 = await repository.create({
        portfolioId: portfolio2.id,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 2,
        averageCost: 50000,
      });

      expect(holding1.id).not.toBe(holding2.id);
      expect(holding1.portfolioId).not.toBe(holding2.portfolioId);
    });

    it('should handle Decimal values correctly', async () => {
      const holding = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: '0.00012345',
        averageCost: '67890.12345678',
      });

      expect(holding.quantity).toBe('0.00012345');
      expect(holding.averageCost).toBe('67890.12345678');
    });
  });

  describe('findAll', () => {
    it('should return all holdings for portfolio', async () => {
      await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'ETH',
        name: 'Ethereum',
        quantity: 10,
        averageCost: 3000,
      });

      const holdings = await repository.findAll(testPortfolioId);

      expect(holdings).toHaveLength(2);
      expect(holdings[0].symbol).toBe('BTC'); // First created
      expect(holdings[1].symbol).toBe('ETH');
    });

    it('should return empty array if no holdings', async () => {
      const holdings = await repository.findAll(testPortfolioId);
      expect(holdings).toEqual([]);
    });

    it('should only return holdings for specified portfolio', async () => {
      const portfolio2 = await prisma.portfolio.create({
        data: {
          name: 'Portfolio 2',
          userId: testUserId,
        },
      });

      await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      await repository.create({
        portfolioId: portfolio2.id,
        symbol: 'ETH',
        name: 'Ethereum',
        quantity: 10,
        averageCost: 3000,
      });

      const holdings = await repository.findAll(testPortfolioId);
      expect(holdings).toHaveLength(1);
      expect(holdings[0].symbol).toBe('BTC');
    });
  });

  describe('findById', () => {
    it('should return holding by ID', async () => {
      const created = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.symbol).toBe('BTC');
    });

    it('should return null if holding not found', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findBySymbol', () => {
    it('should find holding by symbol in portfolio', async () => {
      await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      const found = await repository.findBySymbol(testPortfolioId, 'BTC');

      expect(found).toBeDefined();
      expect(found!.symbol).toBe('BTC');
      expect(found!.portfolioId).toBe(testPortfolioId);
    });

    it('should return null if symbol not in portfolio', async () => {
      const found = await repository.findBySymbol(testPortfolioId, 'ETH');
      expect(found).toBeNull();
    });

    it('should differentiate between portfolios', async () => {
      const portfolio2 = await prisma.portfolio.create({
        data: {
          name: 'Portfolio 2',
          userId: testUserId,
        },
      });

      await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      const found = await repository.findBySymbol(portfolio2.id, 'BTC');
      expect(found).toBeNull();
    });
  });

  describe('findWithTransactions', () => {
    it('should include transactions', async () => {
      const holding = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      // Create transactions
      await prisma.transaction.create({
        data: {
          holdingId: holding.id,
          type: 'BUY',
          quantity: '1.00000000',
          pricePerUnit: '45000.00000000',
          totalCost: '45000.00000000',
          date: new Date('2024-01-01'),
        },
      });

      const found = await repository.findWithTransactions(holding.id);

      expect(found).toBeDefined();
      expect(found!.transactions).toBeDefined();
      expect(found!.transactions).toHaveLength(1);
      expect(found!.transactions[0].type).toBe('BUY');
    });

    it('should order transactions by date descending', async () => {
      const holding = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 2,
        averageCost: 45000,
      });

      await prisma.transaction.create({
        data: {
          holdingId: holding.id,
          type: 'BUY',
          quantity: '1.00000000',
          pricePerUnit: '45000.00000000',
          totalCost: '45000.00000000',
          date: new Date('2024-01-01'),
        },
      });

      await prisma.transaction.create({
        data: {
          holdingId: holding.id,
          type: 'BUY',
          quantity: '1.00000000',
          pricePerUnit: '50000.00000000',
          totalCost: '50000.00000000',
          date: new Date('2024-02-01'),
        },
      });

      const found = await repository.findWithTransactions(holding.id);

      expect(found!.transactions).toHaveLength(2);
      expect(found!.transactions[0].date.getTime()).toBeGreaterThan(
        found!.transactions[1].date.getTime()
      );
    });
  });

  describe('update', () => {
    it('should update quantity', async () => {
      const holding = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      const updated = await repository.update(holding.id, {
        quantity: 2,
      });

      expect(updated.quantity).toBe('2.00000000');
      expect(updated.averageCost).toBe(holding.averageCost); // Unchanged
    });

    it('should update average cost', async () => {
      const holding = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      const updated = await repository.update(holding.id, {
        averageCost: 50000,
      });

      expect(updated.averageCost).toBe('50000.00000000');
      expect(updated.quantity).toBe(holding.quantity); // Unchanged
    });

    it('should update notes', async () => {
      const holding = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      const updated = await repository.update(holding.id, {
        notes: 'Updated notes',
      });

      expect(updated.notes).toBe('Updated notes');
    });

    it('should update multiple fields', async () => {
      const holding = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      const updated = await repository.update(holding.id, {
        quantity: 2.5,
        averageCost: 48000,
        notes: 'Increased position',
      });

      expect(updated.quantity).toBe('2.50000000');
      expect(updated.averageCost).toBe('48000.00000000');
      expect(updated.notes).toBe('Increased position');
    });

    it('should throw if holding not found', async () => {
      await expect(
        repository.update('non-existent-id', { quantity: 1 })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete holding', async () => {
      const holding = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      await repository.delete(holding.id);

      const found = await repository.findById(holding.id);
      expect(found).toBeNull();
    });

    it('should cascade delete transactions', async () => {
      const holding = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      const transaction = await prisma.transaction.create({
        data: {
          holdingId: holding.id,
          type: 'BUY',
          quantity: '1.00000000',
          pricePerUnit: '45000.00000000',
          totalCost: '45000.00000000',
          date: new Date(),
        },
      });

      await repository.delete(holding.id);

      const foundTransaction = await prisma.transaction.findUnique({
        where: { id: transaction.id },
      });
      expect(foundTransaction).toBeNull();
    });

    it('should throw if holding not found', async () => {
      await expect(repository.delete('non-existent-id')).rejects.toThrow();
    });
  });

  describe('getTotalValue', () => {
    it('should calculate total value with prices', async () => {
      await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 2,
        averageCost: 45000,
      });

      await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'ETH',
        name: 'Ethereum',
        quantity: 10,
        averageCost: 3000,
      });

      const prices = new Map([
        ['BTC', 50000],
        ['ETH', 3500],
      ]);

      const totalValue = await repository.getTotalValue(testPortfolioId, prices);

      // BTC: 2 * 50000 = 100000
      // ETH: 10 * 3500 = 35000
      // Total: 135000
      expect(totalValue).toBe(135000);
    });

    it('should return 0 for empty portfolio', async () => {
      const prices = new Map();
      const totalValue = await repository.getTotalValue(testPortfolioId, prices);
      expect(totalValue).toBe(0);
    });

    it('should handle missing prices as 0', async () => {
      await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      const prices = new Map(); // No prices
      const totalValue = await repository.getTotalValue(testPortfolioId, prices);
      expect(totalValue).toBe(0);
    });
  });

  describe('getSymbols', () => {
    it('should return all unique symbols', async () => {
      await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'ETH',
        name: 'Ethereum',
        quantity: 10,
        averageCost: 3000,
      });

      await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'ADA',
        name: 'Cardano',
        quantity: 100,
        averageCost: 1,
      });

      const symbols = await repository.getSymbols(testPortfolioId);

      expect(symbols).toHaveLength(3);
      expect(symbols).toContain('BTC');
      expect(symbols).toContain('ETH');
      expect(symbols).toContain('ADA');
    });

    it('should return empty array for empty portfolio', async () => {
      const symbols = await repository.getSymbols(testPortfolioId);
      expect(symbols).toEqual([]);
    });
  });

  describe('exists', () => {
    it('should return true if holding exists', async () => {
      const holding = await repository.create({
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
      });

      const exists = await repository.exists(holding.id);
      expect(exists).toBe(true);
    });

    it('should return false if holding does not exist', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });
});
