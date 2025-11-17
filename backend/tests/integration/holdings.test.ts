/**
 * T070: Integration tests for Holdings API
 * Tests:
 * - GET /holdings returns holdings with current prices
 * - POST /holdings adds new holding
 * - Holding values calculated correctly
 */

import request from 'supertest';
import { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import Decimal from 'decimal.js';

describe('Holdings API Integration Tests', () => {
  let app: Application;
  let prisma: PrismaClient;
  const testUserId = 'test-user-holdings-integration';
  let testPortfolioId: string;
  let testHoldingId: string;

  beforeAll(async () => {
    app = createApp();
    prisma = new PrismaClient();

    // Clean up any existing test data
    await cleanupTestData();

    // Create a test portfolio
    const portfolio = await prisma.portfolio.create({
      data: {
        userId: testUserId,
        name: 'Holdings Test Portfolio',
        description: 'Portfolio for holdings integration tests',
      },
    });
    testPortfolioId = portfolio.id;
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  /**
   * Helper function to clean up test data
   */
  async function cleanupTestData() {
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

  describe('POST /api/portfolios/:portfolioId/holdings', () => {
    it('should add a new holding', async () => {
      const holdingData = {
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: '0.5',
        averageCost: '45000.00',
        notes: 'Test holding',
      };

      const response = await request(app)
        .post(`/api/portfolios/${testPortfolioId}/holdings`)
        .send(holdingData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        symbol: holdingData.symbol,
        name: holdingData.name,
        portfolioId: testPortfolioId,
      });
      expect(response.body.data.id).toBeDefined();

      // Verify quantity and averageCost are stored as Decimal
      const quantity = new Decimal(response.body.data.quantity);
      const averageCost = new Decimal(response.body.data.averageCost);
      expect(quantity.equals(new Decimal(holdingData.quantity))).toBe(true);
      expect(averageCost.equals(new Decimal(holdingData.averageCost))).toBe(true);

      // Store for later tests
      testHoldingId = response.body.data.id;
    });

    it('should fail to add holding with invalid data', async () => {
      const invalidData = {
        symbol: 'BTC',
        quantity: '-1', // Negative quantity should fail
        averageCost: '45000.00',
      };

      await request(app)
        .post(`/api/portfolios/${testPortfolioId}/holdings`)
        .send(invalidData)
        .expect(400);
    });

    it('should fail to add holding with missing required fields', async () => {
      const invalidData = {
        symbol: 'ETH',
        // Missing quantity and averageCost
      };

      await request(app)
        .post(`/api/portfolios/${testPortfolioId}/holdings`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/portfolios/:portfolioId/holdings', () => {
    it('should return holdings with current prices', async () => {
      const response = await request(app)
        .get(`/api/portfolios/${testPortfolioId}/holdings`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify holding structure includes price information
      const holding = response.body.data[0];
      expect(holding).toHaveProperty('symbol');
      expect(holding).toHaveProperty('quantity');
      expect(holding).toHaveProperty('averageCost');
      expect(holding).toHaveProperty('currentPrice');
      expect(holding).toHaveProperty('currentValue');
      expect(holding).toHaveProperty('costBasis');
    });

    it('should support sorting by symbol', async () => {
      // Add another holding for sorting test
      await request(app)
        .post(`/api/portfolios/${testPortfolioId}/holdings`)
        .send({
          symbol: 'ETH',
          name: 'Ethereum',
          quantity: '2.0',
          averageCost: '3000.00',
        });

      const response = await request(app)
        .get(`/api/portfolios/${testPortfolioId}/holdings?sortBy=symbol&order=asc`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      // Verify sorting
      const symbols = response.body.data.map((h: any) => h.symbol);
      const sortedSymbols = [...symbols].sort();
      expect(symbols).toEqual(sortedSymbols);
    });

    it('should calculate holding values correctly', async () => {
      const response = await request(app)
        .get(`/api/portfolios/${testPortfolioId}/holdings`)
        .expect('Content-Type', /json/)
        .expect(200);

      const holding = response.body.data.find((h: any) => h.id === testHoldingId);
      expect(holding).toBeDefined();

      // Verify value calculation
      const quantity = new Decimal(holding.quantity);
      const averageCost = new Decimal(holding.averageCost);
      const currentPrice = new Decimal(holding.currentPrice);

      const expectedCostBasis = quantity.times(averageCost);
      const expectedCurrentValue = quantity.times(currentPrice);

      expect(new Decimal(holding.costBasis).equals(expectedCostBasis)).toBe(true);
      expect(new Decimal(holding.currentValue).equals(expectedCurrentValue)).toBe(true);

      // Verify gain/loss calculation
      if (holding.gainLoss !== null && holding.gainLoss !== undefined) {
        const expectedGainLoss = expectedCurrentValue.minus(expectedCostBasis);
        expect(new Decimal(holding.gainLoss).equals(expectedGainLoss)).toBe(true);
      }
    });
  });

  describe('GET /api/portfolios/:portfolioId/holdings/:id', () => {
    it('should return holding details', async () => {
      const response = await request(app)
        .get(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testHoldingId,
        symbol: 'BTC',
        name: 'Bitcoin',
      });
    });

    it('should return 404 for non-existent holding', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app)
        .get(`/api/portfolios/${testPortfolioId}/holdings/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('PATCH /api/portfolios/:portfolioId/holdings/:id', () => {
    it('should update holding', async () => {
      const updateData = {
        quantity: '0.75',
        notes: 'Updated test holding',
      };

      const response = await request(app)
        .patch(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(new Decimal(response.body.data.quantity).equals(new Decimal(updateData.quantity))).toBe(true);
      expect(response.body.data.notes).toBe(updateData.notes);
    });
  });

  describe('DELETE /api/portfolios/:portfolioId/holdings/:id', () => {
    it('should delete holding', async () => {
      await request(app)
        .delete(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}`)
        .expect(204);

      // Verify deletion
      await request(app)
        .get(`/api/portfolios/${testPortfolioId}/holdings/${testHoldingId}`)
        .expect(404);
    });
  });
});
