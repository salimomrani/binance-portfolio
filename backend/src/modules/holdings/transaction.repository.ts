/**
 * T022: Transaction Repository
 * Data access layer for Transaction entity
 * All Prisma queries for transactions centralized here
 */

import { PrismaClient, Transaction, TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';
import { logger } from '../../shared/services/logger.service';

/**
 * Transaction Repository Type
 * Following functional pattern with factory function for DI
 */
export type TransactionRepository = {
  findAll: (holdingId: string) => Promise<Transaction[]>;
  findById: (id: string) => Promise<Transaction | null>;
  findByDateRange: (holdingId: string, startDate: Date, endDate: Date) => Promise<Transaction[]>;
  create: (data: CreateTransactionData) => Promise<Transaction>;
  update: (id: string, data: UpdateTransactionData) => Promise<Transaction>;
  delete: (id: string) => Promise<void>;
  getTotalInvested: (holdingId: string) => Promise<number>;
  getAveragePrice: (holdingId: string) => Promise<number>;
  exists: (id: string) => Promise<boolean>;
};

/**
 * Data Transfer Objects
 */
export type CreateTransactionData = {
  holdingId: string;
  type: 'BUY' | 'SELL' | TransactionType;
  quantity: number | string | Decimal;
  pricePerUnit: number | string | Decimal;
  totalCost: number | string | Decimal;
  fee?: number | string | Decimal;
  date: Date;
  notes?: string;
};

export type UpdateTransactionData = {
  type?: 'BUY' | 'SELL' | TransactionType;
  quantity?: number | string | Decimal;
  pricePerUnit?: number | string | Decimal;
  totalCost?: number | string | Decimal;
  fee?: number | string | Decimal;
  date?: Date;
  notes?: string;
};

/**
 * Create Transaction Repository
 * Factory function for dependency injection
 */
export const createTransactionRepository = (prisma: PrismaClient): TransactionRepository => ({
  /**
   * Find all transactions for a holding
   */
  findAll: async (holdingId: string): Promise<Transaction[]> => {
    try {
      return await prisma.transaction.findMany({
        where: { holdingId },
        orderBy: { date: 'desc' },
      });
    } catch (error) {
      logger.error(`Error finding transactions for holding ${holdingId}:`, error);
      throw error;
    }
  },

  /**
   * Find transaction by ID
   */
  findById: async (id: string): Promise<Transaction | null> => {
    try {
      return await prisma.transaction.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error(`Error finding transaction ${id}:`, error);
      throw error;
    }
  },

  /**
   * Find transactions within a date range
   */
  findByDateRange: async (
    holdingId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> => {
    try {
      return await prisma.transaction.findMany({
        where: {
          holdingId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
      });
    } catch (error) {
      logger.error(
        `Error finding transactions for holding ${holdingId} between ${startDate} and ${endDate}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Create a new transaction
   */
  create: async (data: CreateTransactionData): Promise<Transaction> => {
    try {
      const transaction = await prisma.transaction.create({
        data: {
          holdingId: data.holdingId,
          type: data.type as TransactionType,
          quantity: new Decimal(data.quantity).toFixed(8),
          pricePerUnit: new Decimal(data.pricePerUnit).toFixed(8),
          totalCost: new Decimal(data.totalCost).toFixed(8),
          fee: data.fee ? new Decimal(data.fee).toFixed(8) : '0',
          date: data.date,
          notes: data.notes,
        },
      });

      logger.info(
        `Created ${transaction.type} transaction ${transaction.id} for holding ${data.holdingId}`
      );
      return transaction;
    } catch (error) {
      logger.error('Error creating transaction:', error);
      throw error;
    }
  },

  /**
   * Update a transaction
   */
  update: async (id: string, data: UpdateTransactionData): Promise<Transaction> => {
    try {
      // Build update data with Decimal conversion
      const updateData: any = {};

      if (data.type !== undefined) {
        updateData.type = data.type as TransactionType;
      }
      if (data.quantity !== undefined) {
        updateData.quantity = new Decimal(data.quantity).toFixed(8);
      }
      if (data.pricePerUnit !== undefined) {
        updateData.pricePerUnit = new Decimal(data.pricePerUnit).toFixed(8);
      }
      if (data.totalCost !== undefined) {
        updateData.totalCost = new Decimal(data.totalCost).toFixed(8);
      }
      if (data.fee !== undefined) {
        updateData.fee = new Decimal(data.fee).toFixed(8);
      }
      if (data.date !== undefined) {
        updateData.date = data.date;
      }
      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }

      const transaction = await prisma.transaction.update({
        where: { id },
        data: updateData,
      });

      logger.info(`Updated transaction ${id}`);
      return transaction;
    } catch (error) {
      logger.error(`Error updating transaction ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a transaction
   */
  delete: async (id: string): Promise<void> => {
    try {
      await prisma.transaction.delete({
        where: { id },
      });

      logger.info(`Deleted transaction ${id}`);
    } catch (error) {
      logger.error(`Error deleting transaction ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get total invested amount in a holding
   * Calculates sum of all BUY transactions minus SELL transactions
   */
  getTotalInvested: async (holdingId: string): Promise<number> => {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { holdingId },
        select: {
          type: true,
          totalCost: true,
        },
      });

      let totalInvested = new Decimal(0);

      for (const transaction of transactions) {
        const cost = new Decimal(transaction.totalCost);

        if (transaction.type === 'BUY') {
          totalInvested = totalInvested.plus(cost);
        } else if (transaction.type === 'SELL') {
          totalInvested = totalInvested.minus(cost);
        }
      }

      return totalInvested.toNumber();
    } catch (error) {
      logger.error(`Error calculating total invested for holding ${holdingId}:`, error);
      throw error;
    }
  },

  /**
   * Get weighted average price for a holding
   * Calculates based on all BUY transactions
   */
  getAveragePrice: async (holdingId: string): Promise<number> => {
    try {
      const buyTransactions = await prisma.transaction.findMany({
        where: {
          holdingId,
          type: 'BUY',
        },
        select: {
          quantity: true,
          pricePerUnit: true,
        },
        orderBy: { date: 'asc' },
      });

      if (buyTransactions.length === 0) {
        return 0;
      }

      let totalQuantity = new Decimal(0);
      let totalCost = new Decimal(0);

      for (const transaction of buyTransactions) {
        const quantity = new Decimal(transaction.quantity);
        const price = new Decimal(transaction.pricePerUnit);
        const cost = quantity.times(price);

        totalQuantity = totalQuantity.plus(quantity);
        totalCost = totalCost.plus(cost);
      }

      if (totalQuantity.equals(0)) {
        return 0;
      }

      return totalCost.dividedBy(totalQuantity).toNumber();
    } catch (error) {
      logger.error(`Error calculating average price for holding ${holdingId}:`, error);
      throw error;
    }
  },

  /**
   * Check if transaction exists
   */
  exists: async (id: string): Promise<boolean> => {
    try {
      const count = await prisma.transaction.count({
        where: { id },
      });

      return count > 0;
    } catch (error) {
      logger.error(`Error checking if transaction ${id} exists:`, error);
      throw error;
    }
  },
});
