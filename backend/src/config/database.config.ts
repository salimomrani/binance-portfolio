// src/config/database.config.ts
import { PrismaClient } from '@prisma/client';
import { env } from './env.config';
import { loggerService } from '@/shared/services/logger.service';

// Prevent multiple PrismaClient instances in dev mode with hot reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.node.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
    errorFormat: env.node.isDevelopment ? 'pretty' : 'minimal',
  });

// Store Prisma client globally in dev mode (hot-reload safe)
if (env.node.isDevelopment) globalForPrisma.prisma = prisma;

/**
 * Explicit connect when server starts
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    loggerService.info('📦 Database connected successfully');
  } catch (err: unknown) {
    loggerService.error('❌ Database connection failed', { error: err });
    throw err;
  }
}

/**
 * Explicit disconnect on shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    loggerService.info('📦 Database disconnected successfully');
  } catch (err: unknown) {
    loggerService.error('❌ Database disconnection failed', { error: err });
    throw err;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  loggerService.info('Received SIGINT. Closing database connection...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  loggerService.info('Received SIGTERM. Closing database connection...');
  await disconnectDatabase();
  process.exit(0);
});
