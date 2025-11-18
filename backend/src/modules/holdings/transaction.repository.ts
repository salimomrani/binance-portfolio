/**
 * Transaction Repository
 * Data access layer for transactions
 * T022: Create transaction repository with CRUD operations
 */

import { PrismaClient, Transaction, TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';

/**
 * Transaction Repository Type
 */
export type TransactionRepository = {
  findAll: (
    holdingId: string,
    sortBy?: 'date' | 'quantity' | 'totalCost' | 'type',
    order?: 'asc' | 'desc',
    skip?: number,
    take?: number
  ) => Promise<Transaction[]>;
  findById: (id: string) => Promise<Transaction | null>;
  findByDateRange: (holdingId: string, startDate: Date, endDate: Date) => Promise<Transaction[]>;
  count: (holdingId: string) => Promise<number>;
  create: (data: {
    holdingId: string;
    type: TransactionType;
    quantity: Decimal;
    pricePerUnit: Decimal;
    totalCost: Decimal;
    fee: Decimal;
    date: Date;
    notes?: string;
  }) => Promise<Transaction>;
  update: (id: string, data: {
    quantity?: Decimal;
    pricePerUnit?: Decimal;
    fee?: Decimal;
    date?: Date;
    notes?: string;
  }) => Promise<Transaction>;
  delete: (id: string) => Promise<void>;
  getTotalInvested: (holdingId: string) => Promise<number>;
  getAveragePrice: (holdingId: string) => Promise<number>;
};

/**
 * Create Transaction Repository
 */
export const createTransactionRepository = (prisma: PrismaClient): TransactionRepository => ({
  /**
   * Find all transactions for a holding with pagination and sorting
   */
  findAll: async (
    holdingId: string,
    sortBy: 'date' | 'quantity' | 'totalCost' | 'type' = 'date',
    order: 'asc' | 'desc' = 'desc',
    skip: number = 0,
    take?: number
  ) => {
    return prisma.transaction.findMany({
      where: { holdingId },
      orderBy: { [sortBy]: order },
      skip,
      take,
    });
  },

  /**
   * Find transaction by ID
   */
  findById: async (id: string) => {
    return prisma.transaction.findUnique({
      where: { id },
    });
  },

  /**
   * Find transactions within a date range
   */
  findByDateRange: async (holdingId: string, startDate: Date, endDate: Date) => {
    return prisma.transaction.findMany({
      where: {
        holdingId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  },

  /**
   * Count transactions for a holding
   */
  count: async (holdingId: string) => {
    return prisma.transaction.count({
      where: { holdingId },
    });
  },

  /**
   * Create a new transaction
   */
  create: async (data) => {
    return prisma.transaction.create({
      data: {
        holdingId: data.holdingId,
        type: data.type,
        quantity: data.quantity.toFixed(8),
        pricePerUnit: data.pricePerUnit.toFixed(8),
        totalCost: data.totalCost.toFixed(8),
        fee: data.fee.toFixed(8),
        date: data.date,
        notes: data.notes,
      },
    });
  },

  /**
   * Update a transaction
   */
  update: async (id, data) => {
    const updateData: {
      quantity?: string;
      pricePerUnit?: string;
      fee?: string;
      date?: Date;
      notes?: string;
    } = {};

    if (data.quantity !== undefined) {
      updateData.quantity = data.quantity.toFixed(8);
    }
    if (data.pricePerUnit !== undefined) {
      updateData.pricePerUnit = data.pricePerUnit.toFixed(8);
    }
    if (data.fee !== undefined) {
      updateData.fee = data.fee.toFixed(8);
    }
    if (data.date !== undefined) {
      updateData.date = data.date;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    // Recalculate totalCost if price or quantity changed
    if (data.quantity || data.pricePerUnit || data.fee) {
      const transaction = await prisma.transaction.findUnique({ where: { id } });
      if (!transaction) throw new Error('Transaction not found');

      const quantity = data.quantity || new Decimal(transaction.quantity);
      const pricePerUnit = data.pricePerUnit || new Decimal(transaction.pricePerUnit);
      const fee = data.fee || new Decimal(transaction.fee);
      const totalCost = quantity.times(pricePerUnit).plus(fee);
      updateData.quantity = quantity.toFixed(8);
      updateData.pricePerUnit = pricePerUnit.toFixed(8);
      updateData.fee = fee.toFixed(8);
      (updateData as any).totalCost = totalCost.toFixed(8);
    }

    return prisma.transaction.update({
      where: { id },
      data: updateData,
    });
  },

  /**
   * Delete a transaction
   */
  delete: async (id) => {
    await prisma.transaction.delete({
      where: { id },
    });
  },

  /**
   * Get total amount invested in a holding (sum of all BUY transaction costs)
   */
  getTotalInvested: async (holdingId: string) => {
    const transactions = await prisma.transaction.findMany({
      where: {
        holdingId,
        type: 'BUY',
      },
      select: { totalCost: true },
    });

    return transactions.reduce((total, t) => {
      return total + new Decimal(t.totalCost).toNumber();
    }, 0);
  },

  /**
   * Get average purchase price for a holding
   */
  getAveragePrice: async (holdingId: string) => {
    const transactions = await prisma.transaction.findMany({
      where: {
        holdingId,
        type: 'BUY',
      },
      select: { quantity: true, pricePerUnit: true },
    });

    if (transactions.length === 0) return 0;

    let totalCost = new Decimal(0);
    let totalQuantity = new Decimal(0);

    for (const t of transactions) {
      const qty = new Decimal(t.quantity);
      const price = new Decimal(t.pricePerUnit);
      totalCost = totalCost.plus(qty.times(price));
      totalQuantity = totalQuantity.plus(qty);
    }

    return totalQuantity.greaterThan(0)
      ? totalCost.dividedBy(totalQuantity).toNumber()
      : 0;
  },
});
