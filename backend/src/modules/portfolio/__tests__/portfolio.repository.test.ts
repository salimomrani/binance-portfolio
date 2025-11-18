/**
 * Integration tests for PortfolioRepository
 * Tests all database operations with real Prisma client
 * Target coverage: 90%+
 */

import { PrismaClient } from '@prisma/client';
import { PortfolioRepository } from '../portfolio.repository';
import { createTestPrismaClient, cleanupDatabase, createTestUser } from '../../../../tests/helpers';

describe('PortfolioRepository', () => {
  let prisma: PrismaClient;
  let repository: PortfolioRepository;
  let testUserId: string;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    repository = new PortfolioRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);
    // Create a test user for all tests
    const user = await createTestUser(prisma, { id: 'test-user-1' });
    testUserId = user.id;
  });

  // ============================================================
  // Query Operations
  // ============================================================

  describe('findAll', () => {
    it('should return empty array when user has no portfolios', async () => {
      const result = await repository.findAll(testUserId);
      expect(result).toEqual([]);
    });

    it('should find all portfolios for a user', async () => {
      // Arrange: Create test portfolios
      await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Portfolio 1',
          description: 'First portfolio',
        },
      });
      await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Portfolio 2',
          description: 'Second portfolio',
        },
      });

      // Act
      const result = await repository.findAll(testUserId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Portfolio 2'); // Ordered by createdAt desc
      expect(result[1].name).toBe('Portfolio 1');
    });

    it('should only return portfolios for the specified user', async () => {
      // Arrange: Create portfolios for different users
      const user2 = await createTestUser(prisma, { id: 'test-user-2', email: 'user2@test.com' });

      await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'User 1 Portfolio',
        },
      });
      await prisma.portfolio.create({
        data: {
          userId: user2.id,
          name: 'User 2 Portfolio',
        },
      });

      // Act
      const result = await repository.findAll(testUserId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('User 1 Portfolio');
    });
  });

  describe('findAllWithHoldings', () => {
    it('should return portfolios with holdings included', async () => {
      // Arrange: Create portfolio with holdings
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Test Portfolio',
        },
      });
      await prisma.holding.create({
        data: {
          portfolioId: portfolio.id,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: 1,
          averagePrice: 50000,
        },
      });

      // Act
      const result = await repository.findAllWithHoldings(testUserId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].holdings).toHaveLength(1);
      expect(result[0].holdings[0].symbol).toBe('BTC');
    });

    it('should return empty holdings array for portfolio without holdings', async () => {
      // Arrange
      await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Empty Portfolio',
        },
      });

      // Act
      const result = await repository.findAllWithHoldings(testUserId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].holdings).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return null when portfolio does not exist', async () => {
      const result = await repository.findById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should find portfolio by id', async () => {
      // Arrange
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Test Portfolio',
          description: 'Test description',
        },
      });

      // Act
      const result = await repository.findById(portfolio.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(portfolio.id);
      expect(result?.name).toBe('Test Portfolio');
      expect(result?.description).toBe('Test description');
    });
  });

  describe('findByIdWithHoldings', () => {
    it('should return null when portfolio does not exist', async () => {
      const result = await repository.findByIdWithHoldings('non-existent-id');
      expect(result).toBeNull();
    });

    it('should find portfolio by id with holdings included', async () => {
      // Arrange
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Test Portfolio',
        },
      });
      await prisma.holding.create({
        data: {
          portfolioId: portfolio.id,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: 1,
          averagePrice: 50000,
        },
      });
      await prisma.holding.create({
        data: {
          portfolioId: portfolio.id,
          symbol: 'ETH',
          name: 'Ethereum',
          quantity: 10,
          averagePrice: 3000,
        },
      });

      // Act
      const result = await repository.findByIdWithHoldings(portfolio.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(portfolio.id);
      expect(result?.holdings).toHaveLength(2);
      expect(result?.holdings.map(h => h.symbol).sort()).toEqual(['BTC', 'ETH']);
    });
  });

  describe('findDefaultPortfolio', () => {
    it('should return null when user has no default portfolio', async () => {
      // Arrange: Create portfolio but not default
      await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Non-default Portfolio',
          isDefault: false,
        },
      });

      // Act
      const result = await repository.findDefaultPortfolio(testUserId);

      // Assert
      expect(result).toBeNull();
    });

    it('should find user\'s default portfolio', async () => {
      // Arrange
      await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Non-default Portfolio',
          isDefault: false,
        },
      });
      const defaultPortfolio = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Default Portfolio',
          isDefault: true,
        },
      });

      // Act
      const result = await repository.findDefaultPortfolio(testUserId);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(defaultPortfolio.id);
      expect(result?.isDefault).toBe(true);
    });

    it('should only return default portfolio for specified user', async () => {
      // Arrange: Create default portfolios for different users
      const user2 = await createTestUser(prisma, { id: 'test-user-2', email: 'user2@test.com' });

      await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'User 1 Default',
          isDefault: true,
        },
      });
      await prisma.portfolio.create({
        data: {
          userId: user2.id,
          name: 'User 2 Default',
          isDefault: true,
        },
      });

      // Act
      const result = await repository.findDefaultPortfolio(testUserId);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.name).toBe('User 1 Default');
    });
  });

  // ============================================================
  // Create/Update/Delete Operations
  // ============================================================

  describe('create', () => {
    it('should create a new portfolio', async () => {
      // Arrange
      const portfolioData = {
        userId: testUserId,
        name: 'New Portfolio',
        description: 'Test description',
      };

      // Act
      const result = await repository.create(portfolioData);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.name).toBe('New Portfolio');
      expect(result.description).toBe('Test description');
      expect(result.isDefault).toBe(false);
    });

    it('should create portfolio with isDefault flag', async () => {
      // Arrange
      const portfolioData = {
        userId: testUserId,
        name: 'Default Portfolio',
        isDefault: true,
      };

      // Act
      const result = await repository.create(portfolioData);

      // Assert
      expect(result.isDefault).toBe(true);
    });

    it('should create portfolio without description', async () => {
      // Arrange
      const portfolioData = {
        userId: testUserId,
        name: 'Minimal Portfolio',
      };

      // Act
      const result = await repository.create(portfolioData);

      // Assert
      expect(result.name).toBe('Minimal Portfolio');
      expect(result.description).toBeNull();
    });
  });

  describe('update', () => {
    it('should update portfolio name and description', async () => {
      // Arrange
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Original Name',
          description: 'Original Description',
        },
      });

      // Act
      const result = await repository.update(portfolio.id, {
        name: 'Updated Name',
        description: 'Updated Description',
      });

      // Assert
      expect(result.id).toBe(portfolio.id);
      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('Updated Description');
    });

    it('should update only name', async () => {
      // Arrange
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Original Name',
          description: 'Original Description',
        },
      });

      // Act
      const result = await repository.update(portfolio.id, {
        name: 'New Name',
      });

      // Assert
      expect(result.name).toBe('New Name');
      expect(result.description).toBe('Original Description');
    });

    it('should update isDefault flag', async () => {
      // Arrange
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Test Portfolio',
          isDefault: false,
        },
      });

      // Act
      const result = await repository.update(portfolio.id, {
        isDefault: true,
      });

      // Assert
      expect(result.isDefault).toBe(true);
    });

    it('should throw error when portfolio does not exist', async () => {
      // Act & Assert
      await expect(
        repository.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete portfolio', async () => {
      // Arrange
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'To Delete',
        },
      });

      // Act
      await repository.delete(portfolio.id);

      // Assert
      const result = await repository.findById(portfolio.id);
      expect(result).toBeNull();
    });

    it('should throw error when portfolio does not exist', async () => {
      // Act & Assert
      await expect(
        repository.delete('non-existent-id')
      ).rejects.toThrow();
    });

    it('should cascade delete holdings when portfolio is deleted', async () => {
      // Arrange: Create portfolio with holdings
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Portfolio with Holdings',
        },
      });
      await prisma.holding.create({
        data: {
          portfolioId: portfolio.id,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: 1,
          averagePrice: 50000,
        },
      });

      // Act
      await repository.delete(portfolio.id);

      // Assert: Verify holdings are also deleted
      const holdings = await prisma.holding.findMany({
        where: { portfolioId: portfolio.id },
      });
      expect(holdings).toEqual([]);
    });
  });

  describe('setAsDefault', () => {
    it('should set portfolio as default', async () => {
      // Arrange
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Test Portfolio',
          isDefault: false,
        },
      });

      // Act
      const result = await repository.setAsDefault(testUserId, portfolio.id);

      // Assert
      expect(result.id).toBe(portfolio.id);
      expect(result.isDefault).toBe(true);
    });

    it('should unset other default portfolios for the user', async () => {
      // Arrange: Create two portfolios, one default
      const portfolio1 = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Old Default',
          isDefault: true,
        },
      });
      const portfolio2 = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'New Default',
          isDefault: false,
        },
      });

      // Act: Set portfolio2 as default
      await repository.setAsDefault(testUserId, portfolio2.id);

      // Assert: portfolio1 should no longer be default
      const oldDefault = await repository.findById(portfolio1.id);
      expect(oldDefault?.isDefault).toBe(false);

      const newDefault = await repository.findById(portfolio2.id);
      expect(newDefault?.isDefault).toBe(true);
    });

    it('should only affect portfolios for the specified user', async () => {
      // Arrange: Create default portfolios for different users
      const user2 = await createTestUser(prisma, { id: 'test-user-2', email: 'user2@test.com' });

      const user1Portfolio = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'User 1 Portfolio',
          isDefault: false,
        },
      });
      const user2Portfolio = await prisma.portfolio.create({
        data: {
          userId: user2.id,
          name: 'User 2 Portfolio',
          isDefault: true,
        },
      });

      // Act: Set user1Portfolio as default
      await repository.setAsDefault(testUserId, user1Portfolio.id);

      // Assert: user2's default should remain unchanged
      const user2DefaultAfter = await repository.findById(user2Portfolio.id);
      expect(user2DefaultAfter?.isDefault).toBe(true);
    });

    it('should handle transaction atomically', async () => {
      // Arrange
      const portfolio1 = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Portfolio 1',
          isDefault: true,
        },
      });
      const portfolio2 = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Portfolio 2',
          isDefault: false,
        },
      });

      // Act
      await repository.setAsDefault(testUserId, portfolio2.id);

      // Assert: Verify exactly one default portfolio
      const allPortfolios = await repository.findAll(testUserId);
      const defaultPortfolios = allPortfolios.filter(p => p.isDefault);
      expect(defaultPortfolios).toHaveLength(1);
      expect(defaultPortfolios[0].id).toBe(portfolio2.id);
    });
  });

  // ============================================================
  // Utility Operations
  // ============================================================

  describe('countByUser', () => {
    it('should return 0 when user has no portfolios', async () => {
      const result = await repository.countByUser(testUserId);
      expect(result).toBe(0);
    });

    it('should count portfolios for a user', async () => {
      // Arrange: Create portfolios
      await prisma.portfolio.create({
        data: { userId: testUserId, name: 'Portfolio 1' },
      });
      await prisma.portfolio.create({
        data: { userId: testUserId, name: 'Portfolio 2' },
      });
      await prisma.portfolio.create({
        data: { userId: testUserId, name: 'Portfolio 3' },
      });

      // Act
      const result = await repository.countByUser(testUserId);

      // Assert
      expect(result).toBe(3);
    });

    it('should only count portfolios for specified user', async () => {
      // Arrange: Create portfolios for different users
      const user2 = await createTestUser(prisma, { id: 'test-user-2', email: 'user2@test.com' });

      await prisma.portfolio.create({
        data: { userId: testUserId, name: 'User 1 Portfolio' },
      });
      await prisma.portfolio.create({
        data: { userId: user2.id, name: 'User 2 Portfolio' },
      });

      // Act
      const result = await repository.countByUser(testUserId);

      // Assert
      expect(result).toBe(1);
    });
  });

  describe('exists', () => {
    it('should return false when portfolio does not exist', async () => {
      const result = await repository.exists('non-existent-id');
      expect(result).toBe(false);
    });

    it('should return true when portfolio exists', async () => {
      // Arrange
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Test Portfolio',
        },
      });

      // Act
      const result = await repository.exists(portfolio.id);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('findHoldings', () => {
    it('should return empty array when portfolio has no holdings', async () => {
      // Arrange
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Empty Portfolio',
        },
      });

      // Act
      const result = await repository.findHoldings(portfolio.id);

      // Assert
      expect(result).toEqual([]);
    });

    it('should find all holdings for a portfolio', async () => {
      // Arrange
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: testUserId,
          name: 'Test Portfolio',
        },
      });
      await prisma.holding.create({
        data: {
          portfolioId: portfolio.id,
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: 1,
          averagePrice: 50000,
        },
      });
      await prisma.holding.create({
        data: {
          portfolioId: portfolio.id,
          symbol: 'ETH',
          name: 'Ethereum',
          quantity: 10,
          averagePrice: 3000,
        },
      });

      // Act
      const result = await repository.findHoldings(portfolio.id);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map(h => h.symbol).sort()).toEqual(['BTC', 'ETH']);
    });
  });
});
