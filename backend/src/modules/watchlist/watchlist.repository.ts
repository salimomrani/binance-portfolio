// T164: Watchlist repository

import { PrismaClient, WatchlistItem, Prisma } from '@prisma/client';

/**
 * Watchlist Repository Type
 * Handles all database operations for watchlist items
 */
export type WatchlistRepository = {
  findAll: (userId: string) => Promise<WatchlistItem[]>;
  findById: (id: string) => Promise<WatchlistItem | null>;
  findBySymbol: (userId: string, symbol: string) => Promise<WatchlistItem | null>;
  create: (data: Prisma.WatchlistItemCreateInput) => Promise<WatchlistItem>;
  delete: (id: string) => Promise<void>;
  exists: (userId: string, symbol: string) => Promise<boolean>;
  countByUser: (userId: string) => Promise<number>;
};

/**
 * Create Watchlist Repository
 * Factory function for creating watchlist repository instance
 */
export const createWatchlistRepository = (
  prisma: PrismaClient
): WatchlistRepository => ({
  /**
   * Find all watchlist items for a user
   */
  findAll: async (userId: string) => {
    return prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
    });
  },

  /**
   * Find watchlist item by ID
   */
  findById: async (id: string) => {
    return prisma.watchlistItem.findUnique({
      where: { id },
    });
  },

  /**
   * Find watchlist item by user and symbol
   */
  findBySymbol: async (userId: string, symbol: string) => {
    return prisma.watchlistItem.findUnique({
      where: {
        userId_symbol: {
          userId,
          symbol: symbol.toUpperCase(),
        },
      },
    });
  },

  /**
   * Create a new watchlist item
   */
  create: async (data: Prisma.WatchlistItemCreateInput) => {
    return prisma.watchlistItem.create({ data });
  },

  /**
   * Delete a watchlist item
   */
  delete: async (id: string) => {
    await prisma.watchlistItem.delete({
      where: { id },
    });
  },

  /**
   * Check if a watchlist item exists for user and symbol
   */
  exists: async (userId: string, symbol: string) => {
    const count = await prisma.watchlistItem.count({
      where: {
        userId,
        symbol: symbol.toUpperCase(),
      },
    });
    return count > 0;
  },

  /**
   * Count watchlist items for a user
   */
  countByUser: async (userId: string) => {
    return prisma.watchlistItem.count({
      where: { userId },
    });
  },
});
