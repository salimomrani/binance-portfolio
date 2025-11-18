/**
 * Unit tests for HoldingsService
 * Tests business logic with mocked dependencies
 * Target coverage: 95%+
 * T027: Holdings service unit tests
 */

import { Holding } from '@prisma/client';
import Decimal from 'decimal.js';
import { createHoldingsService, HoldingsService } from '../holdings.service';
import { HoldingsRepository } from '../holdings.repository';
import { MarketDataService } from '../../market-data/market-data.service';
import { CalculationsService } from '../../../shared/services/calculations.service';
import { AddHoldingDto, UpdateHoldingDto } from '../holdings.validation';

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('HoldingsService', () => {
  let service: HoldingsService;
  let mockRepository: jest.Mocked<HoldingsRepository>;
  let mockMarketDataService: jest.Mocked<MarketDataService>;
  let mockCalculationsService: jest.Mocked<CalculationsService>;

  const mockHolding: Holding = {
    id: 'holding-1',
    portfolioId: 'portfolio-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    quantity: new Decimal(1),
    averageCost: new Decimal(50000),
    notes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockPrice = {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 60000,
    change1h: 0.5,
    change24h: 2.5,
    change7d: 10.0,
    change30d: 15.0,
    volume24h: 1000000000,
    marketCap: 1000000000000,
    lastUpdated: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repository
    mockRepository = {
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

    // Create mock market data service
    mockMarketDataService = {
      getCurrentPrice: jest.fn(),
      getMultiplePrices: jest.fn(),
      getFullMarketData: jest.fn(),
      getHistoricalPrices: jest.fn(),
      clearCache: jest.fn(),
      getAdapterStatus: jest.fn(),
      getBinanceAdapter: jest.fn(),
    } as any;

    // Create mock calculations service
    mockCalculationsService = {
      calculateGainLoss: jest.fn(),
      calculatePortfolioValue: jest.fn(),
      calculateAllocation: jest.fn(),
    } as any;

    // Create service instance using factory function
    service = createHoldingsService(
      mockRepository,
      mockMarketDataService,
      mockCalculationsService
    );
  });

  // ============================================================
  // Add Holding
  // ============================================================

  describe('addHolding', () => {
    const addHoldingDto: AddHoldingDto = {
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: 1,
      averageCost: 50000,
      notes: 'Test holding',
    };

    it('should add a new holding successfully', async () => {
      // Arrange
      mockRepository.findBySymbol.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockHolding);

      // Act
      const result = await service.addHolding('portfolio-1', addHoldingDto);

      // Assert
      expect(result).toEqual(mockHolding);
      expect(mockRepository.findBySymbol).toHaveBeenCalledWith('portfolio-1', 'BTC');
      expect(mockRepository.create).toHaveBeenCalledWith({
        portfolioId: 'portfolio-1',
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: new Decimal(1),
        averageCost: new Decimal(50000),
        notes: 'Test holding',
      });
    });

    it('should throw error if holding already exists', async () => {
      // Arrange
      mockRepository.findBySymbol.mockResolvedValue(mockHolding);

      // Act & Assert
      await expect(service.addHolding('portfolio-1', addHoldingDto)).rejects.toThrow(
        'Holding for BTC already exists in this portfolio'
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockRepository.findBySymbol.mockResolvedValue(null);
      mockRepository.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.addHolding('portfolio-1', addHoldingDto)).rejects.toThrow('Database error');
    });
  });

  // ============================================================
  // Get Holdings
  // ============================================================

  describe('getHoldings', () => {
    const mockHoldings = [
      {
        ...mockHolding,
        id: 'holding-1',
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: new Decimal(1),
        averageCost: new Decimal(50000),
      },
      {
        ...mockHolding,
        id: 'holding-2',
        symbol: 'ETH',
        name: 'Ethereum',
        quantity: new Decimal(10),
        averageCost: new Decimal(3000),
      },
    ];

    const mockPrices = new Map([
      ['BTC', { ...mockPrice, symbol: 'BTC', price: 60000 }],
      ['ETH', { ...mockPrice, symbol: 'ETH', name: 'Ethereum', price: 3500 }],
    ]);

    const mockGainLoss = {
      amount: new Decimal(10000),
      percentage: new Decimal(20),
    };

    beforeEach(() => {
      mockRepository.findAll.mockResolvedValue(mockHoldings);
      mockMarketDataService.getMultiplePrices.mockResolvedValue(mockPrices);
      mockCalculationsService.calculateGainLoss.mockReturnValue(mockGainLoss);
    });

    it('should return all holdings with current values', async () => {
      // Act
      const result = await service.getHoldings('portfolio-1');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 50000,
        currentPrice: 60000,
      });
      expect(result[1]).toMatchObject({
        symbol: 'ETH',
        name: 'Ethereum',
        quantity: 10,
        averageCost: 3000,
        currentPrice: 3500,
      });
      expect(mockRepository.findAll).toHaveBeenCalledWith('portfolio-1', undefined, 'asc');
      expect(mockMarketDataService.getMultiplePrices).toHaveBeenCalledWith(['BTC', 'ETH']);
    });

    it('should return empty array when no holdings exist', async () => {
      // Arrange
      mockRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.getHoldings('portfolio-1');

      // Assert
      expect(result).toEqual([]);
      expect(mockMarketDataService.getMultiplePrices).not.toHaveBeenCalled();
    });

    it('should calculate allocation percentages correctly', async () => {
      // Act
      const result = await service.getHoldings('portfolio-1');

      // Assert
      // BTC value: 1 * 60000 = 60000
      // ETH value: 10 * 3500 = 35000
      // Total: 95000
      // BTC allocation: 60000 / 95000 = 63.16%
      // ETH allocation: 35000 / 95000 = 36.84%
      expect(result[0].allocationPercentage).toBeCloseTo(63.16, 1);
      expect(result[1].allocationPercentage).toBeCloseTo(36.84, 1);
    });

    it('should handle sorting by value', async () => {
      // Act
      const result = await service.getHoldings('portfolio-1', 'value', 'desc');

      // Assert
      expect(result[0].symbol).toBe('BTC'); // Higher value
      expect(result[1].symbol).toBe('ETH');
      expect(mockRepository.findAll).toHaveBeenCalledWith('portfolio-1', 'value', 'desc');
    });

    it('should handle sorting by gainLoss', async () => {
      // Act
      const result = await service.getHoldings('portfolio-1', 'gainLoss', 'desc');

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith('portfolio-1', 'gainLoss', 'desc');
    });

    it('should handle missing price data gracefully', async () => {
      // Arrange
      mockMarketDataService.getMultiplePrices.mockResolvedValue(new Map());

      // Act
      const result = await service.getHoldings('portfolio-1');

      // Assert
      expect(result[0].currentPrice).toBe(0);
      expect(result[1].currentPrice).toBe(0);
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockRepository.findAll.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getHoldings('portfolio-1')).rejects.toThrow('Database error');
    });
  });

  // ============================================================
  // Get Holding By ID
  // ============================================================

  describe('getHoldingById', () => {
    it('should return holding with current values', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(mockHolding);
      mockMarketDataService.getCurrentPrice.mockResolvedValue(mockPrice);
      mockCalculationsService.calculateGainLoss.mockReturnValue({
        amount: new Decimal(10000),
        percentage: new Decimal(20),
      });

      // Act
      const result = await service.getHoldingById('holding-1');

      // Assert
      expect(result).toMatchObject({
        id: 'holding-1',
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 50000,
        currentPrice: 60000,
        gainLoss: 10000,
        gainLossPercentage: 20,
      });
      expect(mockRepository.findById).toHaveBeenCalledWith('holding-1');
      expect(mockMarketDataService.getCurrentPrice).toHaveBeenCalledWith('BTC');
    });

    it('should throw error if holding not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getHoldingById('holding-1')).rejects.toThrow('Holding not found');
    });

    it('should handle market data errors', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(mockHolding);
      mockMarketDataService.getCurrentPrice.mockRejectedValue(new Error('API error'));

      // Act & Assert
      await expect(service.getHoldingById('holding-1')).rejects.toThrow('API error');
    });
  });

  // ============================================================
  // Update Holding
  // ============================================================

  describe('updateHolding', () => {
    const updateDto: UpdateHoldingDto = {
      quantity: 2,
      averageCost: 55000,
      notes: 'Updated notes',
    };

    it('should update holding successfully', async () => {
      // Arrange
      const updatedHolding = { ...mockHolding, ...updateDto };
      mockRepository.update.mockResolvedValue(updatedHolding);

      // Act
      const result = await service.updateHolding('holding-1', updateDto);

      // Assert
      expect(result).toEqual(updatedHolding);
      expect(mockRepository.update).toHaveBeenCalledWith('holding-1', {
        quantity: new Decimal(2),
        averageCost: new Decimal(55000),
        notes: 'Updated notes',
      });
    });

    it('should update only provided fields', async () => {
      // Arrange
      const partialUpdate = { quantity: 2 };
      mockRepository.update.mockResolvedValue(mockHolding);

      // Act
      await service.updateHolding('holding-1', partialUpdate);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith('holding-1', {
        quantity: new Decimal(2),
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockRepository.update.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.updateHolding('holding-1', updateDto)).rejects.toThrow('Database error');
    });
  });

  // ============================================================
  // Delete Holding
  // ============================================================

  describe('deleteHolding', () => {
    it('should delete holding successfully', async () => {
      // Arrange
      mockRepository.delete.mockResolvedValue(undefined);

      // Act
      await service.deleteHolding('holding-1');

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith('holding-1');
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockRepository.delete.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.deleteHolding('holding-1')).rejects.toThrow('Database error');
    });
  });

  // ============================================================
  // Calculate Holding Value
  // ============================================================

  describe('calculateHoldingValue', () => {
    it('should calculate holding value correctly', async () => {
      // Arrange
      mockMarketDataService.getCurrentPrice.mockResolvedValue(mockPrice);
      mockCalculationsService.calculateGainLoss.mockReturnValue({
        amount: new Decimal(10000),
        percentage: new Decimal(20),
      });

      // Act
      const result = await service.calculateHoldingValue(mockHolding);

      // Assert
      expect(result).toMatchObject({
        symbol: 'BTC',
        currentPrice: 60000,
        currentValue: 60000, // 1 * 60000
        costBasis: 50000, // 1 * 50000
        gainLoss: 10000,
        gainLossPercentage: 20,
      });
      expect(mockMarketDataService.getCurrentPrice).toHaveBeenCalledWith('BTC');
      expect(mockCalculationsService.calculateGainLoss).toHaveBeenCalledWith(
        new Decimal(1),
        new Decimal(50000),
        new Decimal(60000)
      );
    });

    it('should handle market data errors', async () => {
      // Arrange
      mockMarketDataService.getCurrentPrice.mockRejectedValue(new Error('API error'));

      // Act & Assert
      await expect(service.calculateHoldingValue(mockHolding)).rejects.toThrow('API error');
    });
  });
});
