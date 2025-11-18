// T064: Holdings service implementation

import { PrismaClient, Holding } from '@prisma/client';
import Decimal from 'decimal.js';
import { AddHoldingDto, UpdateHoldingDto } from './holdings.validation';
import { HoldingDetails } from '../portfolio/portfolio.types';
import type { MarketDataService } from '../market-data/market-data.service';
import type { CalculationsService } from '../../shared/services/calculations.service';
import { logger } from '../../shared/services/logger.service';

/**
 * Holdings Service Type
 */
export type HoldingsService = {
  addHolding: (portfolioId: string, data: AddHoldingDto) => Promise<Holding>;
  getHoldings: (
    portfolioId: string,
    sortBy?: 'symbol' | 'value' | 'gainLoss',
    order?: 'asc' | 'desc'
  ) => Promise<HoldingDetails[]>;
  getHoldingById: (holdingId: string) => Promise<HoldingDetails>;
  updateHolding: (holdingId: string, data: UpdateHoldingDto) => Promise<Holding>;
  deleteHolding: (holdingId: string) => Promise<void>;
  calculateHoldingValue: (holding: Holding) => Promise<HoldingDetails>;
};

/**
 * Create Holdings Service
 * Factory function for creating holdings service instance
 */
export const createHoldingsService = (
  prisma: PrismaClient,
  marketData: MarketDataService,
  calculations: CalculationsService
): HoldingsService => ({
  /**
   * Add a new holding to a portfolio
   */
  addHolding: async (portfolioId: string, data: AddHoldingDto) => {
    try {
      // Check if holding already exists
      const existing = await prisma.holding.findUnique({
        where: {
          portfolioId_symbol: {
            portfolioId,
            symbol: data.symbol,
          },
        },
      });

      if (existing) {
        throw new Error(`Holding for ${data.symbol} already exists in this portfolio`);
      }

      const holding = await prisma.holding.create({
        data: {
          portfolioId,
          symbol: data.symbol,
          name: data.name,
          quantity: new Decimal(data.quantity),
          averageCost: new Decimal(data.averageCost),
          notes: data.notes,
        },
      });

      logger.info(`Added holding ${holding.symbol} to portfolio ${portfolioId}`);
      return holding;
    } catch (error) {
      logger.error('Error adding holding:', error);
      throw error;
    }
  },

  /**
   * Get all holdings for a portfolio with current values
   */
  getHoldings: async (
    portfolioId: string,
    sortBy?: 'symbol' | 'value' | 'gainLoss',
    order: 'asc' | 'desc' = 'asc'
  ) => {
    try {
      const holdings = await prisma.holding.findMany({
        where: { portfolioId },
        orderBy: sortBy ? { [sortBy]: order } : { createdAt: 'asc' },
      });

      if (holdings.length === 0) {
        return [];
      }

      // Get current prices
      const symbols = holdings.map(h => h.symbol);
      const prices = await marketData.getMultiplePrices(symbols);

      // Calculate total portfolio value for allocation percentages
      let totalValue = new Decimal(0);
      const holdingValues = holdings.map(holding => {
        const currentPrice = prices.get(holding.symbol)?.price || 0;
        const quantity = new Decimal(holding.quantity);
        const value = quantity.times(currentPrice);
        totalValue = totalValue.plus(value);
        return value;
      });

      // Build holding details
      const details = holdings.map((holding, index) => {
        const currentPrice = prices.get(holding.symbol)?.price || 0;
        const quantity = new Decimal(holding.quantity);
        const avgCost = new Decimal(holding.averageCost);
        const currentValue = holdingValues[index];
        const costBasis = quantity.times(avgCost);

        const gainLoss = calculations.calculateGainLoss(quantity, avgCost, new Decimal(currentPrice));

        const allocationPercentage = !totalValue.equals(0)
          ? currentValue.dividedBy(totalValue).times(100).toDecimalPlaces(2).toNumber()
          : 0;

        const priceData = prices.get(holding.symbol);

        return {
          id: holding.id,
          symbol: holding.symbol,
          name: holding.name,
          quantity: quantity.toNumber(),
          averageCost: avgCost.toNumber(),
          currentPrice,
          currentValue: currentValue.toNumber(),
          costBasis: costBasis.toNumber(),
          gainLoss: gainLoss.amount.toNumber(),
          gainLossPercentage: gainLoss.percentage.toNumber(),
          allocationPercentage,
          priceChange24h: priceData?.change24h || 0,
          volume24h: priceData?.volume24h || 0,
          marketCap: priceData?.marketCap || 0,
          notes: holding.notes,
          lastUpdated: new Date(),
        };
      });

      // Apply custom sorting if requested
      if (sortBy === 'value') {
        details.sort((a, b) => {
          const diff = b.currentValue - a.currentValue;
          return order === 'asc' ? -diff : diff;
        });
      } else if (sortBy === 'gainLoss') {
        details.sort((a, b) => {
          const diff = b.gainLossPercentage - a.gainLossPercentage;
          return order === 'asc' ? -diff : diff;
        });
      }

      return details;
    } catch (error) {
      logger.error(`Error getting holdings for portfolio ${portfolioId}:`, error);
      throw error;
    }
  },

  /**
   * Get a single holding by ID with current values
   */
  getHoldingById: async (holdingId: string) => {
    try {
      const holding = await prisma.holding.findUnique({
        where: { id: holdingId },
      });

      if (!holding) {
        throw new Error('Holding not found');
      }

      return calculateHoldingValueInternal(prisma, marketData, calculations, holding);
    } catch (error) {
      logger.error(`Error getting holding ${holdingId}:`, error);
      throw error;
    }
  },

  /**
   * Update a holding
   */
  updateHolding: async (holdingId: string, data: UpdateHoldingDto) => {
    try {
      const updateData: {
        quantity?: Decimal;
        averageCost?: Decimal;
        notes?: string;
      } = {};

      if (data.quantity !== undefined) {
        updateData.quantity = new Decimal(data.quantity);
      }
      if (data.averageCost !== undefined) {
        updateData.averageCost = new Decimal(data.averageCost);
      }
      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }

      const holding = await prisma.holding.update({
        where: { id: holdingId },
        data: updateData,
      });

      logger.info(`Updated holding ${holdingId}`);
      return holding;
    } catch (error) {
      logger.error(`Error updating holding ${holdingId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a holding
   */
  deleteHolding: async (holdingId: string) => {
    try {
      await prisma.holding.delete({
        where: { id: holdingId },
      });

      logger.info(`Deleted holding ${holdingId}`);
    } catch (error) {
      logger.error(`Error deleting holding ${holdingId}:`, error);
      throw error;
    }
  },

  /**
   * Calculate holding value with current price
   */
  calculateHoldingValue: async (holding: Holding) => {
    return calculateHoldingValueInternal(prisma, marketData, calculations, holding);
  },
});

/**
 * Internal helper function to calculate holding value
 */
async function calculateHoldingValueInternal(
  prisma: PrismaClient,
  marketData: MarketDataService,
  calculations: CalculationsService,
  holding: Holding
): Promise<HoldingDetails> {
  try {
    const priceData = await marketData.getCurrentPrice(holding.symbol);
    const currentPrice = priceData.price;

    const quantity = new Decimal(holding.quantity);
    const avgCost = new Decimal(holding.averageCost);
    const currentValue = quantity.times(currentPrice);
    const costBasis = quantity.times(avgCost);

    const gainLoss = calculations.calculateGainLoss(quantity, avgCost, new Decimal(currentPrice));

    return {
      id: holding.id,
      symbol: holding.symbol,
      name: holding.name,
      quantity: quantity.toNumber(),
      averageCost: avgCost.toNumber(),
      currentPrice,
      currentValue: currentValue.toNumber(),
      costBasis: costBasis.toNumber(),
      gainLoss: gainLoss.amount.toNumber(),
      gainLossPercentage: gainLoss.percentage.toNumber(),
      allocationPercentage: 0, // Will be calculated in context of full portfolio
      priceChange24h: priceData.change24h,
      volume24h: priceData.volume24h,
      marketCap: priceData.marketCap,
      notes: holding.notes,
      lastUpdated: new Date(),
    };
  } catch (error) {
    logger.error(`Error calculating holding value for ${holding.id}:`, error);
    throw error;
  }
}
