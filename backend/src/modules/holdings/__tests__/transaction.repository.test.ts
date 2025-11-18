/**
 * T024: Transaction Repository Integration Tests
 * Tests with real database (90%+ coverage target)
 *
 * Tests verify:
 * - CRUD operations for transactions
 * - Date range queries
 * - Aggregate calculations (total invested, average price)
 * - Relationship with holdings
 * - Cascade behavior
 */

import { PrismaClient } from '@prisma/client';
import { createTransactionRepository, TransactionRepository } from '../transaction.repository';

const prisma = new PrismaClient();

describe('TransactionRepository Integration Tests', () => {
  let repository: TransactionRepository;
  let testHoldingId: string;
  let testPortfolioId: string;
  let testUserId: string;

  beforeAll(async () => {
    await prisma.$connect();
    repository = createTransactionRepository(prisma);
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
        email: 'test-transactions@example.com',
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

    // Create test holding
    const holding = await prisma.holding.create({
      data: {
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: '0.00000000',
        averageCost: '0.00000000',
      },
    });
    testHoldingId = holding.id;
  });

  describe('create', () => {
    it('should create a BUY transaction', async () => {
      const transaction = await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1.5,
        pricePerUnit: 45000,
        totalCost: 67500,
        date: new Date('2024-01-01'),
      });

      expect(transaction.id).toBeDefined();
      expect(transaction.type).toBe('BUY');
      expect(transaction.quantity).toBe('1.50000000');
      expect(transaction.pricePerUnit).toBe('45000.00000000');
      expect(transaction.totalCost).toBe('67500.00000000');
      expect(transaction.fee).toBe('0.00000000');
      expect(transaction.holdingId).toBe(testHoldingId);
      expect(transaction.date).toBeInstanceOf(Date);
      expect(transaction.createdAt).toBeInstanceOf(Date);
    });

    it('should create a SELL transaction', async () => {
      const transaction = await repository.create({
        holdingId: testHoldingId,
        type: 'SELL',
        quantity: 0.5,
        pricePerUnit: 50000,
        totalCost: 25000,
        date: new Date('2024-02-01'),
      });

      expect(transaction.type).toBe('SELL');
      expect(transaction.quantity).toBe('0.50000000');
    });

    it('should create transaction with fee', async () => {
      const transaction = await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 45000,
        totalCost: 45050,
        fee: 50,
        date: new Date('2024-01-01'),
      });

      expect(transaction.fee).toBe('50.00000000');
    });

    it('should create transaction with notes', async () => {
      const transaction = await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 45000,
        totalCost: 45000,
        date: new Date('2024-01-01'),
        notes: 'First purchase',
      });

      expect(transaction.notes).toBe('First purchase');
    });

    it('should handle high precision Decimal values', async () => {
      const transaction = await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: '0.00012345',
        pricePerUnit: '67890.12345678',
        totalCost: '8.38271605',
        date: new Date('2024-01-01'),
      });

      expect(transaction.quantity).toBe('0.00012345');
      expect(transaction.pricePerUnit).toBe('67890.12345678');
    });
  });

  describe('findAll', () => {
    it('should return all transactions for holding', async () => {
      await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 45000,
        totalCost: 45000,
        date: new Date('2024-01-01'),
      });

      await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 0.5,
        pricePerUnit: 50000,
        totalCost: 25000,
        date: new Date('2024-02-01'),
      });

      const transactions = await repository.findAll(testHoldingId);

      expect(transactions).toHaveLength(2);
      // Should be ordered by date descending (most recent first)
      expect(transactions[0].date.getTime()).toBeGreaterThan(
        transactions[1].date.getTime()
      );
    });

    it('should return empty array if no transactions', async () => {
      const transactions = await repository.findAll(testHoldingId);
      expect(transactions).toEqual([]);
    });

    it('should only return transactions for specified holding', async () => {
      // Create another holding
      const holding2 = await prisma.holding.create({
        data: {
          portfolioId: testPortfolioId,
          symbol: 'ETH',
          name: 'Ethereum',
          quantity: '0.00000000',
          averageCost: '0.00000000',
        },
      });

      await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 45000,
        totalCost: 45000,
        date: new Date('2024-01-01'),
      });

      await repository.create({
        holdingId: holding2.id,
        type: 'BUY',
        quantity: 10,
        pricePerUnit: 3000,
        totalCost: 30000,
        date: new Date('2024-01-01'),
      });

      const transactions = await repository.findAll(testHoldingId);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].quantity).toBe('1.00000000');
    });
  });

  describe('findById', () => {
    it('should return transaction by ID', async () => {
      const created = await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 45000,
        totalCost: 45000,
        date: new Date('2024-01-01'),
      });

      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.type).toBe('BUY');
    });

    it('should return null if transaction not found', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByDateRange', () => {
    beforeEach(async () => {
      // Create transactions across different dates
      await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 40000,
        totalCost: 40000,
        date: new Date('2024-01-15'),
      });

      await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 0.5,
        pricePerUnit: 45000,
        totalCost: 22500,
        date: new Date('2024-02-15'),
      });

      await repository.create({
        holdingId: testHoldingId,
        type: 'SELL',
        quantity: 0.3,
        pricePerUnit: 50000,
        totalCost: 15000,
        date: new Date('2024-03-15'),
      });
    });

    it('should find transactions within date range', async () => {
      const transactions = await repository.findByDateRange(
        testHoldingId,
        new Date('2024-02-01'),
        new Date('2024-03-01')
      );

      expect(transactions).toHaveLength(1);
      expect(transactions[0].pricePerUnit).toBe('45000.00000000');
    });

    it('should include boundary dates', async () => {
      const transactions = await repository.findByDateRange(
        testHoldingId,
        new Date('2024-02-15'),
        new Date('2024-03-15')
      );

      expect(transactions).toHaveLength(2);
    });

    it('should return empty array if no matches', async () => {
      const transactions = await repository.findByDateRange(
        testHoldingId,
        new Date('2025-01-01'),
        new Date('2025-12-31')
      );

      expect(transactions).toEqual([]);
    });

    it('should order results by date ascending', async () => {
      const transactions = await repository.findByDateRange(
        testHoldingId,
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );

      expect(transactions).toHaveLength(3);
      expect(transactions[0].date.getTime()).toBeLessThan(
        transactions[1].date.getTime()
      );
      expect(transactions[1].date.getTime()).toBeLessThan(
        transactions[2].date.getTime()
      );
    });
  });

  describe('update', () => {
    it('should update transaction type', async () => {
      const transaction = await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 45000,
        totalCost: 45000,
        date: new Date('2024-01-01'),
      });

      const updated = await repository.update(transaction.id, {
        type: 'SELL',
      });

      expect(updated.type).toBe('SELL');
      expect(updated.quantity).toBe(transaction.quantity); // Unchanged
    });

    it('should update quantity', async () => {
      const transaction = await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 45000,
        totalCost: 45000,
        date: new Date('2024-01-01'),
      });

      const updated = await repository.update(transaction.id, {
        quantity: 1.5,
      });

      expect(updated.quantity).toBe('1.50000000');
    });

    it('should update multiple fields', async () => {
      const transaction = await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 45000,
        totalCost: 45000,
        date: new Date('2024-01-01'),
      });

      const updated = await repository.update(transaction.id, {
        quantity: 1.2,
        pricePerUnit: 46000,
        totalCost: 55200,
        fee: 100,
        notes: 'Updated transaction',
      });

      expect(updated.quantity).toBe('1.20000000');
      expect(updated.pricePerUnit).toBe('46000.00000000');
      expect(updated.totalCost).toBe('55200.00000000');
      expect(updated.fee).toBe('100.00000000');
      expect(updated.notes).toBe('Updated transaction');
    });

    it('should throw if transaction not found', async () => {
      await expect(
        repository.update('non-existent-id', { quantity: 1 })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete transaction', async () => {
      const transaction = await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 45000,
        totalCost: 45000,
        date: new Date('2024-01-01'),
      });

      await repository.delete(transaction.id);

      const found = await repository.findById(transaction.id);
      expect(found).toBeNull();
    });

    it('should throw if transaction not found', async () => {
      await expect(repository.delete('non-existent-id')).rejects.toThrow();
    });
  });

  describe('getTotalInvested', () => {
    it('should calculate total invested from BUY transactions', async () => {
      await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 45000,
        totalCost: 45000,
        date: new Date('2024-01-01'),
      });

      await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 0.5,
        pricePerUnit: 50000,
        totalCost: 25000,
        date: new Date('2024-02-01'),
      });

      const totalInvested = await repository.getTotalInvested(testHoldingId);

      // 45000 + 25000 = 70000
      expect(totalInvested).toBe(70000);
    });

    it('should subtract SELL transactions', async () => {
      await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 45000,
        totalCost: 45000,
        date: new Date('2024-01-01'),
      });

      await repository.create({
        holdingId: testHoldingId,
        type: 'SELL',
        quantity: 0.3,
        pricePerUnit: 50000,
        totalCost: 15000,
        date: new Date('2024-02-01'),
      });

      const totalInvested = await repository.getTotalInvested(testHoldingId);

      // 45000 - 15000 = 30000
      expect(totalInvested).toBe(30000);
    });

    it('should return 0 for no transactions', async () => {
      const totalInvested = await repository.getTotalInvested(testHoldingId);
      expect(totalInvested).toBe(0);
    });

    it('should handle negative result (more sold than bought)', async () => {
      await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 45000,
        totalCost: 45000,
        date: new Date('2024-01-01'),
      });

      await repository.create({
        holdingId: testHoldingId,
        type: 'SELL',
        quantity: 1,
        pricePerUnit: 50000,
        totalCost: 50000,
        date: new Date('2024-02-01'),
      });

      const totalInvested = await repository.getTotalInvested(testHoldingId);
      expect(totalInvested).toBe(-5000);
    });
  });

  describe('getAveragePrice', () => {
    it('should calculate weighted average price from BUY transactions', async () => {
      await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 40000,
        totalCost: 40000,
        date: new Date('2024-01-01'),
      });

      await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 50000,
        totalCost: 50000,
        date: new Date('2024-02-01'),
      });

      const avgPrice = await repository.getAveragePrice(testHoldingId);

      // (40000 + 50000) / 2 = 45000
      expect(avgPrice).toBe(45000);
    });

    it('should handle different quantities', async () => {
      await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 40000,
        totalCost: 40000,
        date: new Date('2024-01-01'),
      });

      await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 3,
        pricePerUnit: 50000,
        totalCost: 150000,
        date: new Date('2024-02-01'),
      });

      const avgPrice = await repository.getAveragePrice(testHoldingId);

      // (1*40000 + 3*50000) / (1+3) = 190000 / 4 = 47500
      expect(avgPrice).toBe(47500);
    });

    it('should ignore SELL transactions', async () => {
      await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 40000,
        totalCost: 40000,
        date: new Date('2024-01-01'),
      });

      await repository.create({
        holdingId: testHoldingId,
        type: 'SELL',
        quantity: 0.5,
        pricePerUnit: 50000,
        totalCost: 25000,
        date: new Date('2024-02-01'),
      });

      const avgPrice = await repository.getAveragePrice(testHoldingId);

      // Only BUY transactions: 40000
      expect(avgPrice).toBe(40000);
    });

    it('should return 0 for no transactions', async () => {
      const avgPrice = await repository.getAveragePrice(testHoldingId);
      expect(avgPrice).toBe(0);
    });

    it('should return 0 for only SELL transactions', async () => {
      await repository.create({
        holdingId: testHoldingId,
        type: 'SELL',
        quantity: 1,
        pricePerUnit: 50000,
        totalCost: 50000,
        date: new Date('2024-01-01'),
      });

      const avgPrice = await repository.getAveragePrice(testHoldingId);
      expect(avgPrice).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true if transaction exists', async () => {
      const transaction = await repository.create({
        holdingId: testHoldingId,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 45000,
        totalCost: 45000,
        date: new Date('2024-01-01'),
      });

      const exists = await repository.exists(transaction.id);
      expect(exists).toBe(true);
    });

    it('should return false if transaction does not exist', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });
});
