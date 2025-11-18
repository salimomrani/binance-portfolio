/**
 * Holdings Repository
 * Data access layer for holdings
 * T021: Create holdings repository with CRUD operations
 */

import { PrismaClient, Holding } from '@prisma/client';
import Decimal from 'decimal.js';

/**
 * Holdings Repository Type
 */
export type HoldingsRepository = {
  findAll: (portfolioId: string, sortBy?: 'symbol' | 'value' | 'gainLoss', order?: 'asc' | 'desc') => Promise<Holding[]>;
  findById: (id: string) => Promise<Holding | null>;
  findBySymbol: (portfolioId: string, symbol: string) => Promise<Holding | null>;
  findWithTransactions: (id: string) => Promise<(Holding & { transactions: any[] }) | null>;
  create: (data: {
    portfolioId: string;
    symbol: string;
    name: string;
    quantity: Decimal;
    averageCost: Decimal;
    notes?: string;
  }) => Promise<Holding>;
  update: (id: string, data: {
    quantity?: Decimal;
    averageCost?: Decimal;
    notes?: string;
  }) => Promise<Holding>;
  delete: (id: string) => Promise<void>;
  getTotalValue: (portfolioId: string) => Promise<number>;
  getSymbols: (portfolioId: string) => Promise<string[]>;
};

/**
 * Create Holdings Repository
 */
export const createHoldingsRepository = (prisma: PrismaClient): HoldingsRepository => ({
  /**
   * Find all holdings for a portfolio
   */
  findAll: async (portfolioId: string, sortBy?: 'symbol' | 'value' | 'gainLoss', order: 'asc' | 'desc' = 'asc') => {
    return prisma.holding.findMany({
      where: { portfolioId },
      orderBy: sortBy ? { [sortBy]: order } : { createdAt: 'asc' },
    });
  },

  /**
   * Find holding by ID
   */
  findById: async (id: string) => {
    return prisma.holding.findUnique({
      where: { id },
    });
  },

  /**
   * Find holding by symbol within a portfolio
   */
  findBySymbol: async (portfolioId: string, symbol: string) => {
    return prisma.holding.findUnique({
      where: {
        portfolioId_symbol: {
          portfolioId,
          symbol,
        },
      },
    });
  },

  /**
   * Find holding with its transactions
   */
  findWithTransactions: async (id: string) => {
    return prisma.holding.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { date: 'asc' },
        },
      },
    });
  },

  /**
   * Create a new holding
   */
  create: async (data) => {
    return prisma.holding.create({
      data: {
        portfolioId: data.portfolioId,
        symbol: data.symbol,
        name: data.name,
        quantity: data.quantity,
        averageCost: data.averageCost,
        notes: data.notes,
      },
    });
  },

  /**
   * Update a holding
   */
  update: async (id, data) => {
    const updateData: {
      quantity?: Decimal;
      averageCost?: Decimal;
      notes?: string;
    } = {};

    if (data.quantity !== undefined) {
      updateData.quantity = data.quantity;
    }
    if (data.averageCost !== undefined) {
      updateData.averageCost = data.averageCost;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    return prisma.holding.update({
      where: { id },
      data: updateData,
    });
  },

  /**
   * Delete a holding
   */
  delete: async (id) => {
    await prisma.holding.delete({
      where: { id },
    });
  },

  /**
   * Get total value of all holdings in a portfolio
   * Note: This returns the sum of (quantity * averageCost), not current market value
   */
  getTotalValue: async (portfolioId: string) => {
    const holdings = await prisma.holding.findMany({
      where: { portfolioId },
      select: { quantity: true, averageCost: true },
    });

    return holdings.reduce((total, holding) => {
      const value = new Decimal(holding.quantity).times(new Decimal(holding.averageCost));
      return total + value.toNumber();
    }, 0);
  },

  /**
   * Get all unique symbols from holdings in a portfolio
   */
  getSymbols: async (portfolioId: string) => {
    const holdings = await prisma.holding.findMany({
      where: { portfolioId },
      select: { symbol: true },
    });

    return holdings.map(h => h.symbol);
  },
});
