import { PrismaClient } from '@prisma/client';

/**
 * Test Database Setup
 *
 * This file configures the test database connection and provides utilities
 * for cleaning the database between tests.
 */

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/binance_portfolio_test'
    }
  },
  log: process.env.DEBUG_TESTS ? ['query', 'error', 'warn'] : ['error']
});

/**
 * Connect to the test database
 */
export async function connectTestDatabase() {
  await prisma.$connect();
}

/**
 * Disconnect from the test database
 */
export async function disconnectTestDatabase() {
  await prisma.$disconnect();
}

/**
 * Clean all tables in the correct order (children first, then parents)
 * to avoid foreign key constraint violations
 */
export async function cleanDatabase() {
  // Delete in reverse dependency order
  await prisma.transaction.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.marketData.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Clean database using TRUNCATE for faster cleanup
 * WARNING: This bypasses foreign key checks and should only be used in test environment
 */
export async function truncateDatabase() {
  const tables = ['Transaction', 'Holding', 'Portfolio', 'MarketData', 'User'];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch (error) {
      // If TRUNCATE fails, fall back to DELETE
      console.warn(`TRUNCATE failed for ${table}, using DELETE instead`);
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
    }
  }
}

/**
 * Global setup for Jest
 */
beforeAll(async () => {
  await connectTestDatabase();
});

/**
 * Global teardown for Jest
 */
afterAll(async () => {
  await disconnectTestDatabase();
});

/**
 * Clean database before each test
 */
beforeEach(async () => {
  await cleanDatabase();
});

export default prisma;
