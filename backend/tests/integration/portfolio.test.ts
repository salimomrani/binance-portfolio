/**
 * T069: Integration tests for Portfolio API
 * Tests:
 * - GET /api/portfolios returns user portfolios
 * - POST /api/portfolios creates new portfolio
 * - GET /api/portfolios/:id returns portfolio with holdings
 */

import request from 'supertest';
import { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';

describe('Portfolio API Integration Tests', () => {
  let app: Application;
  let prisma: PrismaClient;
  const testUserId = 'test-user-portfolio-integration';
  let testPortfolioId: string;

  beforeAll(async () => {
    app = createApp();
    prisma = new PrismaClient();

    // Clean up any existing test data
    await cleanupTestData();
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

  describe('POST /api/portfolios', () => {
    it('should create a new portfolio', async () => {
      const portfolioData = {
        name: 'Test Portfolio',
        description: 'Integration test portfolio',
      };

      const response = await request(app)
        .post('/api/portfolios')
        .set('x-user-id', testUserId)
        .send(portfolioData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: portfolioData.name,
        description: portfolioData.description,
        userId: testUserId,
      });
      expect(response.body.data.id).toBeDefined();

      // Store for later tests
      testPortfolioId = response.body.data.id;
    });

    it('should fail to create portfolio with invalid data', async () => {
      const invalidData = {
        name: '', // Empty name should fail validation
      };

      await request(app)
        .post('/api/portfolios')
        .set('x-user-id', testUserId)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/portfolios', () => {
    it('should return user portfolios', async () => {
      const response = await request(app)
        .get('/api/portfolios')
        .set('x-user-id', testUserId)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify our test portfolio is in the list
      const foundPortfolio = response.body.data.find(
        (p: any) => p.id === testPortfolioId
      );
      expect(foundPortfolio).toBeDefined();
      expect(foundPortfolio.name).toBe('Test Portfolio');
    });

    it('should return empty array for user with no portfolios', async () => {
      const response = await request(app)
        .get('/api/portfolios')
        .set('x-user-id', 'non-existent-user')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('GET /api/portfolios/:id', () => {
    it('should return portfolio details with holdings', async () => {
      const response = await request(app)
        .get(`/api/portfolios/${testPortfolioId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testPortfolioId,
        name: 'Test Portfolio',
        description: 'Integration test portfolio',
      });
      expect(response.body.data.holdings).toBeDefined();
      expect(Array.isArray(response.body.data.holdings)).toBe(true);
    });

    it('should return 404 for non-existent portfolio', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app)
        .get(`/api/portfolios/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('PATCH /api/portfolios/:id', () => {
    it('should update portfolio', async () => {
      const updateData = {
        name: 'Updated Test Portfolio',
        description: 'Updated description',
      };

      const response = await request(app)
        .patch(`/api/portfolios/${testPortfolioId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testPortfolioId,
        name: updateData.name,
        description: updateData.description,
      });
    });
  });

  describe('DELETE /api/portfolios/:id', () => {
    it('should delete portfolio', async () => {
      await request(app)
        .delete(`/api/portfolios/${testPortfolioId}`)
        .expect(204);

      // Verify deletion
      await request(app)
        .get(`/api/portfolios/${testPortfolioId}`)
        .expect(404);
    });
  });
});
