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
 * Service for managing cryptocurrency transactions
 */
export class TransactionService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Add a new transaction to a holding
   * Automatically recalculates the holding's average cost
   *
   * @param holdingId - ID of the holding
   * @param data - Transaction data
   * @returns Created transaction
   */
  async addTransaction(
    holdingId: string,
    data: AddTransactionInput
  ): Promise<Transaction> {
    try {
      // Verify holding exists
      const holding = await this.prisma.holding.findUnique({
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
      const transaction = await this.prisma.transaction.create({
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
      await this.updateHoldingAverageCost(holdingId);

      return transaction;
    } catch (error) {
      logger.error('Error adding transaction:', error);
      throw error;
    }
  }

  /**
   * Get transactions for a holding with pagination
   *
   * @param holdingId - ID of the holding
   * @param options - Query options (pagination, sorting)
   * @returns Paginated list of transactions
   */
  async getTransactions(
    holdingId: string,
    options: TransactionQueryOptions = {}
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'date',
        order = 'desc',
      } = options;

      const skip = (page - 1) * limit;

      // Get total count
      const total = await this.prisma.transaction.count({
        where: { holdingId },
      });

      // Get transactions
      const transactions = await this.prisma.transaction.findMany({
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
  }

  /**
   * Recalculate holding's average cost and quantity based on all transactions
   * Uses weighted average cost method for BUY transactions
   *
   * Formula:
   * - New Average Cost = (Current Value + Purchase Cost) / (Current Quantity + Purchase Quantity)
   * - For SELL: Reduces quantity but maintains average cost
   *
   * @param holdingId - ID of the holding to update
   */
  async updateHoldingAverageCost(holdingId: string): Promise<void> {
    try {
      const holding = await this.prisma.holding.findUnique({
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
      await this.prisma.holding.update({
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

  /**
   * Delete a transaction and recalculate holding's average cost
   *
   * @param transactionId - ID of the transaction to delete
   */
  async deleteTransaction(transactionId: string): Promise<void> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new Error(`Transaction with ID ${transactionId} not found`);
      }

      const holdingId = transaction.holdingId;

      // Delete transaction
      await this.prisma.transaction.delete({
        where: { id: transactionId },
      });

      logger.info(`Deleted transaction ${transactionId}`);

      // Recalculate holding's average cost
      await this.updateHoldingAverageCost(holdingId);
    } catch (error) {
      logger.error('Error deleting transaction:', error);
      throw error;
    }
  }
}
