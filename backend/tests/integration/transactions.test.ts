/**
 * T101: Integration tests for Transactions
 * Tests:
 * - Adding transaction updates average cost
 * - Multiple transactions calculate correct weighted average
 */

import request from 'supertest';
import { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import Decimal from 'decimal.js';

describe('Transaction Integration Tests', () => {
  let app: Application;
  let prisma: PrismaClient;
  const testUserId = 'test-user-transactions';
  let testPortfolioId: string;
  let testHoldingId: string;

  beforeAll(async () => {
    app = createApp();
    prisma = new PrismaClient();

    // Clean up and create test data
    await cleanupTestData();

    // Create test portfolio
    const portfolio = await prisma.portfolio.create({
      data: {
        userId: testUserId,
        name: 'Transaction Test Portfolio',
        description: 'For transaction integration tests',
      },
    });
    testPortfolioId = portfolio.id;

    // Create test holding (initial purchase via holding)
    const holding = await prisma.holding.create({
      data: {
        portfolioId: testPortfolioId,
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: '1.0',
        averageCost: '40000.00',
      },
    });
    testHoldingId = holding.id;
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  async function cleanupTestData() {
    await prisma.transaction.deleteMany({
      where: {
        holding: {
          portfolio: {
            userId: testUserId,
          },
        },
      },
    });

    await prisma.holding.deleteMany({
      where: {
        portfolio: {
          userId: testUserId,
        },
      },
    });

    await prisma.portfolio.deleteMany({
      where: {
        userId: testUserId,
      },
    });
  }

  describe('POST /api/portfolios/:portfolioId/holdings/:id/transactions', () => {
    it('should add a BUY transaction and update average cost', async () => {
      const transactionData = {
        type: 'BUY',
        quantity: 1.0,
        pricePerUnit: 50000.0,
        date: new Date('2024-01-15T10:00:00Z').toISOString(),
        notes: 'Second purchase',
      };

      const response = await request(app)
        .post(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}/transactions`)
        .send(transactionData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('BUY');
      expect(response.body.data.holdingId).toBe(testHoldingId);

      // Verify average cost was updated
      const updatedHolding = await prisma.holding.findUnique({
        where: { id: testHoldingId },
      });

      expect(updatedHolding).toBeTruthy();

      // Original: 1 @ 40000 = 40000
      // New: 1 @ 50000 = 50000
      // Weighted avg: (40000 + 50000) / 2 = 45000
      const expectedAvgCost = new Decimal('45000.00');
      const actualAvgCost = new Decimal(updatedHolding!.averageCost);
      expect(actualAvgCost.equals(expectedAvgCost)).toBe(true);

      // Quantity should be 2
      const expectedQuantity = new Decimal('2.00');
      const actualQuantity = new Decimal(updatedHolding!.quantity);
      expect(actualQuantity.equals(expectedQuantity)).toBe(true);
    });

    it('should handle multiple BUY transactions with correct weighted average', async () => {
      // Add third purchase
      const transaction2 = {
        type: 'BUY',
        quantity: 2.0,
        pricePerUnit: 48000.0,
        date: new Date('2024-01-16T10:00:00Z').toISOString(),
        notes: 'Third purchase',
      };

      await request(app)
        .post(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}/transactions`)
        .send(transaction2)
        .expect(201);

      // Verify average cost calculation
      const updatedHolding = await prisma.holding.findUnique({
        where: { id: testHoldingId },
      });

      // Previous: 2 @ 45000 = 90000
      // New: 2 @ 48000 = 96000
      // Total: 4 units for 186000
      // Weighted avg: 186000 / 4 = 46500
      const expectedAvgCost = new Decimal('46500.00');
      const actualAvgCost = new Decimal(updatedHolding!.averageCost);
      expect(actualAvgCost.equals(expectedAvgCost)).toBe(true);

      // Quantity should be 4
      const expectedQuantity = new Decimal('4.00');
      const actualQuantity = new Decimal(updatedHolding!.quantity);
      expect(actualQuantity.equals(expectedQuantity)).toBe(true);
    });

    it('should handle SELL transaction and reduce quantity', async () => {
      const sellTransaction = {
        type: 'SELL',
        quantity: 1.0,
        pricePerUnit: 50000.0,
        date: new Date('2024-01-17T10:00:00Z').toISOString(),
        notes: 'Partial sell',
      };

      await request(app)
        .post(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}/transactions`)
        .send(sellTransaction)
        .expect(201);

      const updatedHolding = await prisma.holding.findUnique({
        where: { id: testHoldingId },
      });

      // Quantity should decrease from 4 to 3
      const expectedQuantity = new Decimal('3.00');
      const actualQuantity = new Decimal(updatedHolding!.quantity);
      expect(actualQuantity.equals(expectedQuantity)).toBe(true);

      // Average cost should remain the same after SELL
      const expectedAvgCost = new Decimal('46500.00');
      const actualAvgCost = new Decimal(updatedHolding!.averageCost);
      expect(actualAvgCost.equals(expectedAvgCost)).toBe(true);
    });

    it('should fail to SELL more than available quantity', async () => {
      const invalidSell = {
        type: 'SELL',
        quantity: 10.0, // More than the 3 available
        pricePerUnit: 50000.0,
        date: new Date('2024-01-18T10:00:00Z').toISOString(),
      };

      await request(app)
        .post(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}/transactions`)
        .send(invalidSell)
        .expect(500); // Should fail with error
    });

    it('should validate required fields', async () => {
      const invalidTransaction = {
        type: 'BUY',
        // Missing quantity and pricePerUnit
        date: new Date().toISOString(),
      };

      await request(app)
        .post(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}/transactions`)
        .send(invalidTransaction)
        .expect(400);
    });

    it('should validate transaction type', async () => {
      const invalidType = {
        type: 'INVALID_TYPE',
        quantity: 1.0,
        pricePerUnit: 50000.0,
        date: new Date().toISOString(),
      };

      await request(app)
        .post(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}/transactions`)
        .send(invalidType)
        .expect(400);
    });

    it('should reject future dates', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const futureTransaction = {
        type: 'BUY',
        quantity: 1.0,
        pricePerUnit: 50000.0,
        date: futureDate.toISOString(),
      };

      await request(app)
        .post(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}/transactions`)
        .send(futureTransaction)
        .expect(400);
    });
  });

  describe('GET /api/portfolios/:portfolioId/holdings/:id/transactions', () => {
    it('should retrieve all transactions for a holding', async () => {
      const response = await request(app)
        .get(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}/transactions`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Should have pagination info
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}/transactions?page=1&limit=2`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqualTo(2);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should support sorting by date descending', async () => {
      const response = await request(app)
        .get(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}/transactions?sortBy=date&order=desc`)
        .expect(200);

      const transactions = response.body.data;
      if (transactions.length > 1) {
        const firstDate = new Date(transactions[0].date);
        const secondDate = new Date(transactions[1].date);
        expect(firstDate >= secondDate).toBe(true);
      }
    });

    it('should return empty array for holding with no transactions', async () => {
      // Create new holding without transactions
      const newHolding = await prisma.holding.create({
        data: {
          portfolioId: testPortfolioId,
          symbol: 'ETH',
          name: 'Ethereum',
          quantity: '1.0',
          averageCost: '3000.00',
        },
      });

      const response = await request(app)
        .get(`/api/portfolios/${testPortfolioId}/holdings/${newHolding.id}/transactions`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);

      // Cleanup
      await prisma.holding.delete({ where: { id: newHolding.id } });
    });
  });

  describe('Complex Transaction Scenarios', () => {
    it('should handle decimal quantities correctly', async () => {
      const decimalTransaction = {
        type: 'BUY',
        quantity: 0.12345678,
        pricePerUnit: 50000.12345678,
        date: new Date('2024-01-19T10:00:00Z').toISOString(),
      };

      const response = await request(app)
        .post(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}/transactions`)
        .send(decimalTransaction)
        .expect(201);

      const transaction = response.body.data;
      expect(new Decimal(transaction.quantity).toFixed(8)).toBe('0.12345678');
      expect(new Decimal(transaction.pricePerUnit).toFixed(8)).toBe('50000.12345678');
    });

    it('should calculate total cost including fees', async () => {
      const transactionWithFee = {
        type: 'BUY',
        quantity: 1.0,
        pricePerUnit: 50000.0,
        fee: 25.0,
        date: new Date('2024-01-20T10:00:00Z').toISOString(),
        notes: 'With transaction fee',
      };

      const response = await request(app)
        .post(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}/transactions`)
        .send(transactionWithFee)
        .expect(201);

      const transaction = response.body.data;
      // Total cost = quantity * price + fee = 1 * 50000 + 25 = 50025
      const expectedTotalCost = new Decimal('50025.00');
      const actualTotalCost = new Decimal(transaction.totalCost);
      expect(actualTotalCost.equals(expectedTotalCost)).toBe(true);
    });
  });
});
