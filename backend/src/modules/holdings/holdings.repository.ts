/**
 * T021: Holdings Repository
 * Data access layer for Holding entity
 * All Prisma queries for holdings centralized here
 */

import { PrismaClient, Holding } from '@prisma/client';
import Decimal from 'decimal.js';
import { logger } from '../../shared/services/logger.service';

/**
 * Holdings Repository Type
 * Following functional pattern with factory function for DI
 */
export type HoldingsRepository = {
  findAll: (portfolioId: string) => Promise<Holding[]>;
  findById: (id: string) => Promise<Holding | null>;
  findBySymbol: (portfolioId: string, symbol: string) => Promise<Holding | null>;
  findWithTransactions: (id: string) => Promise<Holding | null>;
  create: (data: CreateHoldingData) => Promise<Holding>;
  update: (id: string, data: UpdateHoldingData) => Promise<Holding>;
  delete: (id: string) => Promise<void>;
  getTotalValue: (portfolioId: string, prices: Map<string, number>) => Promise<number>;
  getSymbols: (portfolioId: string) => Promise<string[]>;
  exists: (id: string) => Promise<boolean>;
};

/**
 * Data Transfer Objects
 */
export type CreateHoldingData = {
  portfolioId: string;
  symbol: string;
  name: string;
  quantity: number | string | Decimal;
  averageCost: number | string | Decimal;
  notes?: string;
};

export type UpdateHoldingData = {
  quantity?: number | string | Decimal;
  averageCost?: number | string | Decimal;
  notes?: string;
};

/**
 * Create Holdings Repository
 * Factory function for dependency injection
 */
export const createHoldingsRepository = (prisma: PrismaClient): HoldingsRepository => ({
  /**
   * Find all holdings for a portfolio
   */
  findAll: async (portfolioId: string): Promise<Holding[]> => {
    try {
      return await prisma.holding.findMany({
        where: { portfolioId },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      logger.error(`Error finding holdings for portfolio ${portfolioId}:`, error);
      throw error;
    }
  },

  /**
   * Find holding by ID
   */
  findById: async (id: string): Promise<Holding | null> => {
    try {
      return await prisma.holding.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error(`Error finding holding ${id}:`, error);
      throw error;
    }
  },

  /**
   * Find holding by symbol within a portfolio
   */
  findBySymbol: async (portfolioId: string, symbol: string): Promise<Holding | null> => {
    try {
      return await prisma.holding.findUnique({
        where: {
          portfolioId_symbol: {
            portfolioId,
            symbol,
          },
        },
      });
    } catch (error) {
      logger.error(`Error finding holding ${symbol} in portfolio ${portfolioId}:`, error);
      throw error;
    }
  },

  /**
   * Find holding with all transactions included
   */
  findWithTransactions: async (id: string): Promise<Holding | null> => {
    try {
      return await prisma.holding.findUnique({
        where: { id },
        include: {
          transactions: {
            orderBy: { date: 'desc' },
          },
        },
      });
    } catch (error) {
      logger.error(`Error finding holding ${id} with transactions:`, error);
      throw error;
    }
  },

  /**
   * Create a new holding
   */
  create: async (data: CreateHoldingData): Promise<Holding> => {
    try {
      // Check for existing holding
      const existing = await prisma.holding.findUnique({
        where: {
          portfolioId_symbol: {
            portfolioId: data.portfolioId,
            symbol: data.symbol,
          },
        },
      });

      if (existing) {
        throw new Error(
          `Holding for ${data.symbol} already exists in portfolio ${data.portfolioId}`
        );
      }

      const holding = await prisma.holding.create({
        data: {
          portfolioId: data.portfolioId,
          symbol: data.symbol,
          name: data.name,
          quantity: new Decimal(data.quantity).toFixed(8),
          averageCost: new Decimal(data.averageCost).toFixed(8),
          notes: data.notes,
        },
      });

      logger.info(`Created holding ${holding.id} for ${holding.symbol}`);
      return holding;
    } catch (error) {
      logger.error('Error creating holding:', error);
      throw error;
    }
  },

  /**
   * Update a holding
   */
  update: async (id: string, data: UpdateHoldingData): Promise<Holding> => {
    try {
      // Build update data with Decimal conversion
      const updateData: any = {};

      if (data.quantity !== undefined) {
        updateData.quantity = new Decimal(data.quantity).toFixed(8);
      }
      if (data.averageCost !== undefined) {
        updateData.averageCost = new Decimal(data.averageCost).toFixed(8);
      }
      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }

      const holding = await prisma.holding.update({
        where: { id },
        data: updateData,
      });

      logger.info(`Updated holding ${id}`);
      return holding;
    } catch (error) {
      logger.error(`Error updating holding ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a holding (will cascade delete transactions)
   */
  delete: async (id: string): Promise<void> => {
    try {
      await prisma.holding.delete({
        where: { id },
      });

      logger.info(`Deleted holding ${id}`);
    } catch (error) {
      logger.error(`Error deleting holding ${id}:`, error);
      throw error;
    }
  },

  /**
   * Calculate total value of all holdings in a portfolio
   * @param portfolioId - Portfolio ID
   * @param prices - Map of symbol to current price
   */
  getTotalValue: async (portfolioId: string, prices: Map<string, number>): Promise<number> => {
    try {
      const holdings = await prisma.holding.findMany({
        where: { portfolioId },
        select: {
          symbol: true,
          quantity: true,
        },
      });

      let totalValue = new Decimal(0);

      for (const holding of holdings) {
        const currentPrice = prices.get(holding.symbol) || 0;
        const quantity = new Decimal(holding.quantity);
        const value = quantity.times(currentPrice);
        totalValue = totalValue.plus(value);
      }

      return totalValue.toNumber();
    } catch (error) {
      logger.error(`Error calculating total value for portfolio ${portfolioId}:`, error);
      throw error;
    }
  },

  /**
   * Get all unique symbols in a portfolio
   */
  getSymbols: async (portfolioId: string): Promise<string[]> => {
    try {
      const holdings = await prisma.holding.findMany({
        where: { portfolioId },
        select: {
          symbol: true,
        },
      });

      return holdings.map(h => h.symbol);
    } catch (error) {
      logger.error(`Error getting symbols for portfolio ${portfolioId}:`, error);
      throw error;
    }
  },

  /**
   * Check if holding exists
   */
  exists: async (id: string): Promise<boolean> => {
    try {
      const count = await prisma.holding.count({
        where: { id },
      });

      return count > 0;
    } catch (error) {
      logger.error(`Error checking if holding ${id} exists:`, error);
      throw error;
    }
  },
});
