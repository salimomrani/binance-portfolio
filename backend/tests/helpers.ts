/**
 * Test helpers - common utilities for tests
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

/**
 * Create a test Prisma client instance
 */
export function createTestPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5433/crypto_portfolio_test',
      },
    },
  });
}

/**
 * Clean up database before/after tests
 */
export async function cleanupDatabase(prisma: PrismaClient): Promise<void> {
  // Delete in order to respect foreign key constraints
  await prisma.transaction.deleteMany({});
  await prisma.holding.deleteMany({});
  await prisma.portfolio.deleteMany({});
  await prisma.priceHistory.deleteMany({});
  await prisma.priceCache.deleteMany({});
  await prisma.user.deleteMany({});
}

/**
 * Create a test user
 */
export async function createTestUser(
  prisma: PrismaClient,
  data: { id?: string; email?: string; name?: string } = {}
) {
  return prisma.user.create({
    data: {
      id: data.id || 'test-user-1',
      email: data.email || 'test@example.com',
      name: data.name || 'Test User',
      createdAt: new Date(),
    },
  });
}

/**
 * Create a test portfolio
 */
export async function createTestPortfolio(
  prisma: PrismaClient,
  data: {
    id?: string;
    userId?: string;
    name?: string;
    description?: string;
    isDefault?: boolean;
  } = {}
) {
  // Ensure user exists
  const userId = data.userId || 'test-user-1';
  await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
    },
    update: {},
  });

  return prisma.portfolio.create({
    data: {
      id: data.id || 'test-portfolio-1',
      userId,
      name: data.name || 'Test Portfolio',
      description: data.description || 'Test portfolio description',
      isDefault: data.isDefault ?? true,
      createdAt: new Date(),
    },
  });
}

/**
 * Create a test holding
 */
export async function createTestHolding(
  prisma: PrismaClient,
  data: {
    id?: string;
    portfolioId?: string;
    symbol?: string;
    name?: string;
    quantity?: number;
    averagePrice?: number;
  } = {}
) {
  // Ensure portfolio exists
  const portfolioId = data.portfolioId || 'test-portfolio-1';
  await createTestPortfolio(prisma, { id: portfolioId });

  return prisma.holding.create({
    data: {
      id: data.id || 'test-holding-1',
      portfolioId,
      symbol: data.symbol || 'BTC',
      name: data.name || 'Bitcoin',
      quantity: new Decimal(data.quantity || 1),
      averagePrice: new Decimal(data.averagePrice || 50000),
      createdAt: new Date(),
    },
  });
}

/**
 * Create a test transaction
 */
export async function createTestTransaction(
  prisma: PrismaClient,
  data: {
    id?: string;
    holdingId?: string;
    type?: 'BUY' | 'SELL';
    quantity?: number;
    price?: number;
    date?: Date;
    notes?: string;
  } = {}
) {
  // Ensure holding exists
  const holdingId = data.holdingId || 'test-holding-1';
  await createTestHolding(prisma, { id: holdingId });

  return prisma.transaction.create({
    data: {
      id: data.id || 'test-transaction-1',
      holdingId,
      type: data.type || 'BUY',
      quantity: new Decimal(data.quantity || 1),
      price: new Decimal(data.price || 50000),
      date: data.date || new Date(),
      notes: data.notes || 'Test transaction',
      createdAt: new Date(),
    },
  });
}

/**
 * Create test price cache entry
 */
export async function createTestPriceCache(
  prisma: PrismaClient,
  data: {
    symbol?: string;
    name?: string;
    price?: number;
    change1h?: number;
    change24h?: number;
    change7d?: number;
    change30d?: number;
    volume24h?: number;
    marketCap?: number;
    high24h?: number | null;
    low24h?: number | null;
    lastUpdated?: Date;
  } = {}
) {
  return prisma.priceCache.create({
    data: {
      symbol: data.symbol || 'BTC',
      name: data.name || 'Bitcoin',
      price: new Decimal(data.price || 50000),
      change1h: new Decimal(data.change1h || 0.5),
      change24h: new Decimal(data.change24h || 2.5),
      change7d: new Decimal(data.change7d || 10.0),
      change30d: new Decimal(data.change30d || 15.0),
      volume24h: new Decimal(data.volume24h || 1000000000),
      marketCap: new Decimal(data.marketCap || 1000000000000),
      high24h: data.high24h ? new Decimal(data.high24h) : null,
      low24h: data.low24h ? new Decimal(data.low24h) : null,
      lastUpdated: data.lastUpdated || new Date(),
    },
  });
}

/**
 * Create test price history entries
 */
export async function createTestPriceHistory(
  prisma: PrismaClient,
  data: {
    symbol?: string;
    timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
    entries?: Array<{ timestamp: Date; price: number; volume: number }>;
  } = {}
) {
  const symbol = data.symbol || 'BTC';
  const timeframe = data.timeframe || '1h';
  const entries = data.entries || [
    { timestamp: new Date(), price: 50000, volume: 1000000 },
  ];

  await prisma.priceHistory.createMany({
    data: entries.map(entry => ({
      symbol,
      timeframe,
      timestamp: entry.timestamp,
      price: new Decimal(entry.price),
      volume: new Decimal(entry.volume),
    })),
  });
}

/**
 * Wait for a specified amount of time (for testing async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a unique ID for tests
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
