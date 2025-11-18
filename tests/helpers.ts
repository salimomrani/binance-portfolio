import { PrismaClient, User, Portfolio, Holding, Transaction } from '@prisma/client';
import { prisma } from './setup';

/**
 * Test Helpers
 *
 * Common utilities and factory functions for creating test data
 */

/**
 * Create a test user
 */
export async function createTestUser(
  data?: Partial<User>
): Promise<User> {
  return prisma.user.create({
    data: {
      email: data?.email || `test-${Date.now()}@example.com`,
      passwordHash: data?.passwordHash || 'hashed_password_123',
      ...data
    }
  });
}

/**
 * Create a test portfolio for a user
 */
export async function createTestPortfolio(
  userId: string,
  data?: Partial<Portfolio>
): Promise<Portfolio> {
  return prisma.portfolio.create({
    data: {
      name: data?.name || `Test Portfolio ${Date.now()}`,
      description: data?.description || 'Test portfolio description',
      isDefault: data?.isDefault ?? false,
      userId,
      ...data
    }
  });
}

/**
 * Create a test holding for a portfolio
 */
export async function createTestHolding(
  portfolioId: string,
  data?: Partial<Holding>
): Promise<Holding> {
  return prisma.holding.create({
    data: {
      portfolioId,
      symbol: data?.symbol || 'BTC',
      quantity: data?.quantity ?? 1.5,
      averagePrice: data?.averagePrice ?? 50000,
      ...data
    }
  });
}

/**
 * Create a test transaction for a holding
 */
export async function createTestTransaction(
  holdingId: string,
  data?: Partial<Transaction>
): Promise<Transaction> {
  return prisma.transaction.create({
    data: {
      holdingId,
      type: data?.type || 'BUY',
      quantity: data?.quantity ?? 1.0,
      price: data?.price ?? 50000,
      fee: data?.fee ?? 10,
      date: data?.date || new Date(),
      notes: data?.notes,
      ...data
    }
  });
}

/**
 * Create a test market data entry
 */
export async function createTestMarketData(data?: {
  symbol?: string;
  name?: string;
  currentPrice?: number;
  priceChange24h?: number;
  priceChangePercentage24h?: number;
  marketCap?: number;
  volume24h?: number;
}) {
  return prisma.marketData.create({
    data: {
      symbol: data?.symbol || 'BTC',
      name: data?.name || 'Bitcoin',
      currentPrice: data?.currentPrice ?? 50000,
      priceChange24h: data?.priceChange24h ?? 1000,
      priceChangePercentage24h: data?.priceChangePercentage24h ?? 2.0,
      marketCap: data?.marketCap ?? 1000000000000,
      volume24h: data?.volume24h ?? 50000000000,
      lastUpdated: new Date()
    }
  });
}

/**
 * Create a complete test scenario with user, portfolio, holdings, and transactions
 */
export async function createCompleteTestScenario() {
  const user = await createTestUser();

  const portfolio = await createTestPortfolio(user.id, {
    name: 'Main Portfolio',
    isDefault: true
  });

  const btcHolding = await createTestHolding(portfolio.id, {
    symbol: 'BTC',
    quantity: 2.5,
    averagePrice: 45000
  });

  const ethHolding = await createTestHolding(portfolio.id, {
    symbol: 'ETH',
    quantity: 10,
    averagePrice: 3000
  });

  const transaction1 = await createTestTransaction(btcHolding.id, {
    type: 'BUY',
    quantity: 1.5,
    price: 42000,
    date: new Date('2024-01-01')
  });

  const transaction2 = await createTestTransaction(btcHolding.id, {
    type: 'BUY',
    quantity: 1.0,
    price: 50000,
    date: new Date('2024-02-01')
  });

  const btcMarketData = await createTestMarketData({
    symbol: 'BTC',
    name: 'Bitcoin',
    currentPrice: 50000
  });

  const ethMarketData = await createTestMarketData({
    symbol: 'ETH',
    name: 'Ethereum',
    currentPrice: 3200
  });

  return {
    user,
    portfolio,
    holdings: {
      btc: btcHolding,
      eth: ethHolding
    },
    transactions: {
      btc1: transaction1,
      btc2: transaction2
    },
    marketData: {
      btc: btcMarketData,
      eth: ethMarketData
    }
  };
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (!(await condition())) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error('waitFor timeout exceeded');
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
}

/**
 * Mock Request object for controller tests
 */
export function createMockRequest(overrides?: any): any {
  return {
    params: {},
    query: {},
    body: {},
    user: { id: 'test-user-id', email: 'test@example.com' },
    headers: {},
    ...overrides
  };
}

/**
 * Mock Response object for controller tests
 */
export function createMockResponse(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
}

/**
 * Mock NextFunction for controller tests
 */
export function createMockNext(): jest.Mock {
  return jest.fn();
}

/**
 * Assert that a value is defined (TypeScript type guard)
 */
export function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected value to be defined');
  }
}

/**
 * Get a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random email address
 */
export function randomEmail(): string {
  return `test-${Date.now()}-${randomInt(1000, 9999)}@example.com`;
}

/**
 * Sleep for a specified number of milliseconds
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
