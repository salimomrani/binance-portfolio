// T095: Transaction service implementation

import { PrismaClient, Transaction, TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';
import { AddTransactionInput } from './transaction.validation';
import { logger } from '../../shared/services/logger.service';
import { PaginatedResponse } from '../../shared/types/api-response';

/**
 * Transaction query options
 */
export interface TransactionQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'quantity' | 'totalCost' | 'type';
  order?: 'asc' | 'desc';
}

/**
 * Transaction Service Type
 */
export type TransactionService = {
  addTransaction: (holdingId: string, data: AddTransactionInput) => Promise<Transaction>;
  getTransactions: (holdingId: string, options?: TransactionQueryOptions) => Promise<PaginatedResponse<Transaction>>;
  updateHoldingAverageCost: (holdingId: string) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
};

/**
 * Create Transaction Service
 * Factory function for creating transaction service instance
 */
export const createTransactionService = (prisma: PrismaClient): TransactionService => ({
  /**
   * Add a new transaction to a holding
   * Automatically recalculates the holding's average cost
   */
  addTransaction: async (holdingId: string, data: AddTransactionInput) => {
    try {
      // Verify holding exists
      const holding = await prisma.holding.findUnique({
        where: { id: holdingId },
        include: {
          transactions: {
            orderBy: { date: 'asc' },
          },
        },
      });

      if (!holding) {
        throw new Error(`Holding with ID ${holdingId} not found`);
      }

      // Calculate total cost
      const quantity = new Decimal(data.quantity);
      const pricePerUnit = new Decimal(data.pricePerUnit);
      const fee = data.fee ? new Decimal(data.fee) : new Decimal(0);
      const totalCost = quantity.times(pricePerUnit).plus(fee);

      // For SELL transactions, verify sufficient quantity
      if (data.type === 'SELL') {
        const currentQuantity = new Decimal(holding.quantity);
        if (quantity.greaterThan(currentQuantity)) {
          throw new Error(
            `Cannot sell ${quantity.toString()} units. Only ${currentQuantity.toString()} units available.`
          );
        }
      }

      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          holdingId,
          type: data.type as TransactionType,
          quantity: quantity.toFixed(8),
          pricePerUnit: pricePerUnit.toFixed(8),
          totalCost: totalCost.toFixed(8),
          fee: fee.toFixed(8),
          date: new Date(data.date),
          notes: data.notes,
        },
      });

      logger.info(
        `Added ${data.type} transaction for holding ${holdingId}: ${quantity.toString()} units at ${pricePerUnit.toString()}`
      );

      // Recalculate holding's average cost and quantity
      await updateHoldingAverageCostInternal(prisma, holdingId);

      return transaction;
    } catch (error) {
      logger.error('Error adding transaction:', error);
      throw error;
    }
  },

  /**
   * Get transactions for a holding with pagination
   */
  getTransactions: async (holdingId: string, options: TransactionQueryOptions = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'date',
        order = 'desc',
      } = options;

      const skip = (page - 1) * limit;

      // Get total count
      const total = await prisma.transaction.count({
        where: { holdingId },
      });

      // Get transactions
      const transactions = await prisma.transaction.findMany({
        where: { holdingId },
        orderBy: { [sortBy]: order },
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Error fetching transactions:', error);
      throw error;
    }
  },

  /**
   * Recalculate holding's average cost and quantity based on all transactions
   */
  updateHoldingAverageCost: async (holdingId: string) => {
    return updateHoldingAverageCostInternal(prisma, holdingId);
  },

  /**
   * Delete a transaction and recalculate holding's average cost
   */
  deleteTransaction: async (transactionId: string) => {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new Error(`Transaction with ID ${transactionId} not found`);
      }

      const holdingId = transaction.holdingId;

      // Delete transaction
      await prisma.transaction.delete({
        where: { id: transactionId },
      });

      logger.info(`Deleted transaction ${transactionId}`);

      // Recalculate holding's average cost
      await updateHoldingAverageCostInternal(prisma, holdingId);
    } catch (error) {
      logger.error('Error deleting transaction:', error);
      throw error;
    }
  },
});

/**
 * Internal helper function to recalculate holding's average cost
 * Uses weighted average cost method for BUY transactions
 */
async function updateHoldingAverageCostInternal(prisma: PrismaClient, holdingId: string): Promise<void> {
  try {
    const holding = await prisma.holding.findUnique({
      where: { id: holdingId },
      include: {
        transactions: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!holding) {
      throw new Error(`Holding with ID ${holdingId} not found`);
    }

    // If no transactions, keep current values
    if (holding.transactions.length === 0) {
      return;
    }

    // Calculate weighted average cost and final quantity
    let totalQuantity = new Decimal(0);
    let totalCost = new Decimal(0);

    for (const transaction of holding.transactions) {
      const quantity = new Decimal(transaction.quantity);
      const pricePerUnit = new Decimal(transaction.pricePerUnit);

      if (transaction.type === 'BUY') {
        // Add to total cost and quantity
        totalCost = totalCost.plus(quantity.times(pricePerUnit));
        totalQuantity = totalQuantity.plus(quantity);
      } else if (transaction.type === 'SELL') {
        // Calculate cost of sold units at average price
        if (totalQuantity.greaterThan(0)) {
          const currentAvgCost = totalCost.dividedBy(totalQuantity);
          const soldCost = quantity.times(currentAvgCost);
          totalCost = totalCost.minus(soldCost);
          totalQuantity = totalQuantity.minus(quantity);
        }
      }
    }

    // Calculate new average cost
    const newAverageCost =
      totalQuantity.greaterThan(0)
        ? totalCost.dividedBy(totalQuantity)
        : new Decimal(0);

    // Update holding
    await prisma.holding.update({
      where: { id: holdingId },
      data: {
        quantity: totalQuantity.toFixed(8),
        averageCost: newAverageCost.toFixed(8),
      },
    });

    logger.info(
      `Updated holding ${holdingId}: quantity=${totalQuantity.toString()}, avgCost=${newAverageCost.toString()}`
    );
  } catch (error) {
    logger.error('Error updating holding average cost:', error);
    throw error;
  }
}
