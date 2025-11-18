/**
 * Unit tests for PortfolioService
 * Tests business logic with mocked dependencies
 * Target coverage: 95%+
 */

import { Portfolio } from '@prisma/client';
import Decimal from 'decimal.js';
import { PortfolioService } from '../portfolio.service';
import { PortfolioRepository } from '../portfolio.repository';
import { MarketDataService } from '../../market-data/market-data.service';
import { CalculationsService } from '../../../shared/services/calculations.service';

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('PortfolioService', () => {
  let service: PortfolioService;
  let mockRepository: jest.Mocked<PortfolioRepository>;
  let mockMarketDataService: jest.Mocked<MarketDataService>;
  let mockCalculationsService: jest.Mocked<CalculationsService>;

  const mockPortfolio: Portfolio = {
    id: 'portfolio-1',
    userId: 'user-1',
    name: 'Test Portfolio',
    description: 'Test description',
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockHolding = {
    id: 'holding-1',
    portfolioId: 'portfolio-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    quantity: new Decimal(1),
    averagePrice: new Decimal(50000),
    averageCost: new Decimal(50000),
    notes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repository
    mockRepository = {
      findAll: jest.fn(),
      findAllWithHoldings: jest.fn(),
      findById: jest.fn(),
      findByIdWithHoldings: jest.fn(),
      findDefaultPortfolio: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      setAsDefault: jest.fn(),
      countByUser: jest.fn(),
      exists: jest.fn(),
      findHoldings: jest.fn(),
    } as any;

    // Create mock market data service
    mockMarketDataService = {
      getCurrentPrice: jest.fn(),
      getMultiplePrices: jest.fn(),
      getMarketData: jest.fn(),
      refreshPrices: jest.fn(),
      getHistoricalPrices: jest.fn(),
    } as any;

    // Create mock calculations service
    mockCalculationsService = {
      calculateGainLoss: jest.fn(),
      calculatePortfolioValue: jest.fn(),
      calculateAllocation: jest.fn(),
    } as any;

    // Create service instance
    service = new PortfolioService(
      mockRepository,
      mockMarketDataService,
      mockCalculationsService
    );
  });

  // ============================================================
  // Create Portfolio
  // ============================================================

  describe('createPortfolio', () => {
    it('should create a new portfolio', async () => {
      // Arrange
      const createDto = {
        name: 'New Portfolio',
        description: 'New description',
      };
      mockRepository.create.mockResolvedValue(mockPortfolio);

      // Act
      const result = await service.createPortfolio('user-1', createDto);

      // Assert
      expect(result).toEqual(mockPortfolio);
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        name: 'New Portfolio',
        description: 'New description',
      });
    });

    it('should create portfolio without description', async () => {
      // Arrange
      const createDto = {
        name: 'Minimal Portfolio',
      };
      mockRepository.create.mockResolvedValue(mockPortfolio);

      // Act
      await service.createPortfolio('user-1', createDto);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        name: 'Minimal Portfolio',
        description: undefined,
      });
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const createDto = { name: 'Test' };
      mockRepository.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.createPortfolio('user-1', createDto)).rejects.toThrow('Database error');
    });
  });

  // ============================================================
  // Get Portfolios
  // ============================================================

  describe('getPortfolios', () => {
    it('should return empty array when user has no portfolios', async () => {
      // Arrange
      mockRepository.findAllWithHoldings.mockResolvedValue([]);

      // Act
      const result = await service.getPortfolios('user-1');

      // Assert
      expect(result).toEqual([]);
      expect(mockRepository.findAllWithHoldings).toHaveBeenCalledWith('user-1');
    });

    it('should return portfolio summaries with calculated values', async () => {
      // Arrange
      const portfolioWithHoldings = {
        ...mockPortfolio,
        holdings: [mockHolding],
      };
      mockRepository.findAllWithHoldings.mockResolvedValue([portfolioWithHoldings] as any);
      mockRepository.findHoldings.mockResolvedValue([mockHolding] as any);
      mockMarketDataService.getMultiplePrices.mockResolvedValue(
        new Map([['BTC', { price: 55000, change24h: 2.5 }]])
      );

      // Act
      const result = await service.getPortfolios('user-1');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('portfolio-1');
      expect(result[0].name).toBe('Test Portfolio');
      expect(result[0].holdingsCount).toBe(1);
      expect(result[0].totalValue).toBeGreaterThan(0);
    });

    it('should handle portfolios without holdings', async () => {
      // Arrange
      const portfolioWithoutHoldings = {
        ...mockPortfolio,
        holdings: [],
      };
      mockRepository.findAllWithHoldings.mockResolvedValue([portfolioWithoutHoldings] as any);
      mockRepository.findHoldings.mockResolvedValue([]);

      // Act
      const result = await service.getPortfolios('user-1');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].holdingsCount).toBe(0);
      expect(result[0].totalValue).toBe(0);
      expect(result[0].totalGainLoss).toBe(0);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      mockRepository.findAllWithHoldings.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getPortfolios('user-1')).rejects.toThrow('Database error');
    });
  });

  // ============================================================
  // Get Portfolio By ID
  // ============================================================

  describe('getPortfolioById', () => {
    it('should throw error when portfolio not found', async () => {
      // Arrange
      mockRepository.findByIdWithHoldings.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPortfolioById('non-existent')).rejects.toThrow('Portfolio not found');
    });

    it('should return portfolio details with holdings', async () => {
      // Arrange
      const portfolioWithHoldings = {
        ...mockPortfolio,
        holdings: [mockHolding],
      };
      mockRepository.findByIdWithHoldings.mockResolvedValue(portfolioWithHoldings as any);
      mockMarketDataService.getMultiplePrices.mockResolvedValue(
        new Map([['BTC', { price: 55000, change24h: 2.5 }]])
      );
      mockCalculationsService.calculateGainLoss.mockReturnValue({
        amount: new Decimal(5000),
        percentage: new Decimal(10),
      });

      // Act
      const result = await service.getPortfolioById('portfolio-1');

      // Assert
      expect(result.id).toBe('portfolio-1');
      expect(result.name).toBe('Test Portfolio');
      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0].symbol).toBe('BTC');
      expect(result.holdings[0].currentPrice).toBe(55000);
    });

    it('should handle portfolio without holdings', async () => {
      // Arrange
      const portfolioWithoutHoldings = {
        ...mockPortfolio,
        holdings: [],
      };
      mockRepository.findByIdWithHoldings.mockResolvedValue(portfolioWithoutHoldings as any);
      mockMarketDataService.getMultiplePrices.mockResolvedValue(new Map());

      // Act
      const result = await service.getPortfolioById('portfolio-1');

      // Assert
      expect(result.holdings).toHaveLength(0);
      expect(result.totalValue).toBe(0);
      expect(result.totalGainLoss).toBe(0);
    });

    it('should calculate allocation percentages correctly', async () => {
      // Arrange
      const holding1 = { ...mockHolding, symbol: 'BTC', quantity: new Decimal(1), averageCost: new Decimal(50000) };
      const holding2 = { ...mockHolding, id: 'holding-2', symbol: 'ETH', quantity: new Decimal(10), averageCost: new Decimal(3000) };

      const portfolioWithHoldings = {
        ...mockPortfolio,
        holdings: [holding1, holding2],
      };
      mockRepository.findByIdWithHoldings.mockResolvedValue(portfolioWithHoldings as any);
      mockMarketDataService.getMultiplePrices.mockResolvedValue(
        new Map([
          ['BTC', { price: 55000, change24h: 2.5 }],
          ['ETH', { price: 3300, change24h: 1.5 }],
        ])
      );
      mockCalculationsService.calculateGainLoss.mockReturnValue({
        amount: new Decimal(5000),
        percentage: new Decimal(10),
      });

      // Act
      const result = await service.getPortfolioById('portfolio-1');

      // Assert
      expect(result.holdings).toHaveLength(2);
      // BTC: 55000, ETH: 33000 (10 * 3300), Total: 88000
      // BTC allocation should be ~62.5%, ETH ~37.5%
      const btcHolding = result.holdings.find(h => h.symbol === 'BTC');
      const ethHolding = result.holdings.find(h => h.symbol === 'ETH');
      expect(btcHolding?.allocationPercentage).toBeGreaterThan(60);
      expect(ethHolding?.allocationPercentage).toBeGreaterThan(35);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      mockRepository.findByIdWithHoldings.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getPortfolioById('portfolio-1')).rejects.toThrow('Database error');
    });
  });

  // ============================================================
  // Update Portfolio
  // ============================================================

  describe('updatePortfolio', () => {
    it('should update portfolio name and description', async () => {
      // Arrange
      const updateDto = {
        name: 'Updated Name',
        description: 'Updated description',
      };
      const updatedPortfolio = {
        ...mockPortfolio,
        name: 'Updated Name',
        description: 'Updated description',
      };
      mockRepository.update.mockResolvedValue(updatedPortfolio);

      // Act
      const result = await service.updatePortfolio('portfolio-1', updateDto);

      // Assert
      expect(result).toEqual(updatedPortfolio);
      expect(mockRepository.update).toHaveBeenCalledWith('portfolio-1', updateDto);
    });

    it('should update only name', async () => {
      // Arrange
      const updateDto = { name: 'New Name' };
      mockRepository.update.mockResolvedValue(mockPortfolio);

      // Act
      await service.updatePortfolio('portfolio-1', updateDto);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith('portfolio-1', { name: 'New Name' });
    });

    it('should propagate repository errors', async () => {
      // Arrange
      mockRepository.update.mockRejectedValue(new Error('Portfolio not found'));

      // Act & Assert
      await expect(service.updatePortfolio('portfolio-1', {})).rejects.toThrow('Portfolio not found');
    });
  });

  // ============================================================
  // Delete Portfolio
  // ============================================================

  describe('deletePortfolio', () => {
    it('should delete portfolio', async () => {
      // Arrange
      mockRepository.delete.mockResolvedValue();

      // Act
      await service.deletePortfolio('portfolio-1');

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith('portfolio-1');
    });

    it('should propagate repository errors', async () => {
      // Arrange
      mockRepository.delete.mockRejectedValue(new Error('Portfolio not found'));

      // Act & Assert
      await expect(service.deletePortfolio('portfolio-1')).rejects.toThrow('Portfolio not found');
    });
  });

  // ============================================================
  // Calculate Portfolio Statistics
  // ============================================================

  describe('calculatePortfolioStatistics', () => {
    it('should calculate statistics for portfolio with holdings', async () => {
      // Arrange
      const holding1 = { ...mockHolding, symbol: 'BTC', quantity: new Decimal(1), averageCost: new Decimal(50000) };
      const holding2 = { ...mockHolding, id: 'holding-2', symbol: 'ETH', quantity: new Decimal(10), averageCost: new Decimal(3000) };

      const portfolioWithHoldings = {
        ...mockPortfolio,
        holdings: [holding1, holding2],
      };
      mockRepository.findByIdWithHoldings.mockResolvedValue(portfolioWithHoldings as any);
      mockMarketDataService.getMultiplePrices.mockResolvedValue(
        new Map([
          ['BTC', { price: 55000, change24h: 2.5 }],
          ['ETH', { price: 3300, change24h: 1.5 }],
        ])
      );
      mockCalculationsService.calculateGainLoss
        .mockReturnValueOnce({ amount: new Decimal(5000), percentage: new Decimal(10) }) // BTC
        .mockReturnValueOnce({ amount: new Decimal(3000), percentage: new Decimal(10) }); // ETH

      // Act
      const result = await service.calculatePortfolioStatistics('portfolio-1');

      // Assert
      expect(result.totalValue).toBeGreaterThan(0);
      expect(result.totalCostBasis).toBeGreaterThan(0);
      expect(result.totalGainLoss).toBeDefined();
      expect(result.bestPerformer).toBeDefined();
      expect(result.worstPerformer).toBeDefined();
      expect(result.largestHolding).toBeDefined();
    });

    it('should return null performers for portfolio without holdings', async () => {
      // Arrange
      const portfolioWithoutHoldings = {
        ...mockPortfolio,
        holdings: [],
      };
      mockRepository.findByIdWithHoldings.mockResolvedValue(portfolioWithoutHoldings as any);
      mockMarketDataService.getMultiplePrices.mockResolvedValue(new Map());

      // Act
      const result = await service.calculatePortfolioStatistics('portfolio-1');

      // Assert
      expect(result.totalValue).toBe(0);
      expect(result.bestPerformer).toBeNull();
      expect(result.worstPerformer).toBeNull();
      expect(result.largestHolding).toBeNull();
    });

    it('should identify best and worst performers correctly', async () => {
      // Arrange
      const holding1 = { ...mockHolding, symbol: 'BTC' };
      const holding2 = { ...mockHolding, id: 'holding-2', symbol: 'ETH' };
      const holding3 = { ...mockHolding, id: 'holding-3', symbol: 'DOGE' };

      const portfolioWithHoldings = {
        ...mockPortfolio,
        holdings: [holding1, holding2, holding3],
      };
      mockRepository.findByIdWithHoldings.mockResolvedValue(portfolioWithHoldings as any);
      mockMarketDataService.getMultiplePrices.mockResolvedValue(
        new Map([
          ['BTC', { price: 55000, change24h: 2.5 }],
          ['ETH', { price: 2700, change24h: 1.5 }],
          ['DOGE', { price: 0.08, change24h: -5 }],
        ])
      );
      mockCalculationsService.calculateGainLoss
        .mockReturnValueOnce({ amount: new Decimal(5000), percentage: new Decimal(10) }) // BTC: +10%
        .mockReturnValueOnce({ amount: new Decimal(-300), percentage: new Decimal(-10) }) // ETH: -10%
        .mockReturnValueOnce({ amount: new Decimal(-100), percentage: new Decimal(-2) }); // DOGE: -2%

      // Act
      const result = await service.calculatePortfolioStatistics('portfolio-1');

      // Assert
      expect(result.bestPerformer?.symbol).toBe('BTC');
      expect(result.worstPerformer?.symbol).toBe('ETH');
    });

    it('should propagate errors from getPortfolioById', async () => {
      // Arrange
      mockRepository.findByIdWithHoldings.mockRejectedValue(new Error('Portfolio not found'));

      // Act & Assert
      await expect(service.calculatePortfolioStatistics('portfolio-1')).rejects.toThrow('Portfolio not found');
    });
  });

  // ============================================================
  // Get Portfolio Allocation
  // ============================================================

  describe('getPortfolioAllocation', () => {
    it('should return allocation data for portfolio with holdings', async () => {
      // Arrange
      const holding1 = { ...mockHolding, symbol: 'BTC', name: 'Bitcoin', quantity: new Decimal(1), averageCost: new Decimal(50000) };
      const holding2 = { ...mockHolding, id: 'holding-2', symbol: 'ETH', name: 'Ethereum', quantity: new Decimal(10), averageCost: new Decimal(3000) };

      const portfolioWithHoldings = {
        ...mockPortfolio,
        holdings: [holding1, holding2],
      };
      mockRepository.findByIdWithHoldings.mockResolvedValue(portfolioWithHoldings as any);
      mockMarketDataService.getMultiplePrices.mockResolvedValue(
        new Map([
          ['BTC', { price: 55000, change24h: 2.5 }],
          ['ETH', { price: 3300, change24h: 1.5 }],
        ])
      );
      mockCalculationsService.calculateGainLoss.mockReturnValue({
        amount: new Decimal(5000),
        percentage: new Decimal(10),
      });

      // Act
      const result = await service.getPortfolioAllocation('portfolio-1');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('symbol');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('value');
      expect(result[0]).toHaveProperty('percentage');
      expect(result[0]).toHaveProperty('color');
    });

    it('should return empty array for portfolio without holdings', async () => {
      // Arrange
      const portfolioWithoutHoldings = {
        ...mockPortfolio,
        holdings: [],
      };
      mockRepository.findByIdWithHoldings.mockResolvedValue(portfolioWithoutHoldings as any);
      mockMarketDataService.getMultiplePrices.mockResolvedValue(new Map());

      // Act
      const result = await service.getPortfolioAllocation('portfolio-1');

      // Assert
      expect(result).toEqual([]);
    });

    it('should assign unique colors to each cryptocurrency', async () => {
      // Arrange
      const holdings = [
        { ...mockHolding, id: '1', symbol: 'BTC', name: 'Bitcoin' },
        { ...mockHolding, id: '2', symbol: 'ETH', name: 'Ethereum' },
        { ...mockHolding, id: '3', symbol: 'ADA', name: 'Cardano' },
      ];

      const portfolioWithHoldings = {
        ...mockPortfolio,
        holdings,
      };
      mockRepository.findByIdWithHoldings.mockResolvedValue(portfolioWithHoldings as any);
      mockMarketDataService.getMultiplePrices.mockResolvedValue(
        new Map([
          ['BTC', { price: 50000, change24h: 2.5 }],
          ['ETH', { price: 3000, change24h: 1.5 }],
          ['ADA', { price: 1, change24h: 0.5 }],
        ])
      );
      mockCalculationsService.calculateGainLoss.mockReturnValue({
        amount: new Decimal(0),
        percentage: new Decimal(0),
      });

      // Act
      const result = await service.getPortfolioAllocation('portfolio-1');

      // Assert
      expect(result).toHaveLength(3);
      const colors = result.map(r => r.color);
      expect(new Set(colors).size).toBeGreaterThan(1); // At least some different colors
    });

    it('should propagate errors from getPortfolioById', async () => {
      // Arrange
      mockRepository.findByIdWithHoldings.mockRejectedValue(new Error('Portfolio not found'));

      // Act & Assert
      await expect(service.getPortfolioAllocation('portfolio-1')).rejects.toThrow('Portfolio not found');
    });
  });
});
