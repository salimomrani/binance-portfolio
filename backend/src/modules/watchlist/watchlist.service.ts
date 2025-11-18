// T164: Watchlist service implementation

import { WatchlistItem } from '@prisma/client';
import { AddToWatchlistDto } from './watchlist.validation';
import { WatchlistItemDetails } from './watchlist.types';
import type { WatchlistRepository } from './watchlist.repository';
import type { MarketDataService } from '../market-data/market-data.service';
import { logger } from '../../shared/services/logger.service';
import { calculateTrend } from '../../shared/utils/trend.util';

/**
 * Watchlist Service Type
 */
export type WatchlistService = {
  addToWatchlist: (userId: string, data: AddToWatchlistDto) => Promise<WatchlistItem>;
  getWatchlist: (userId: string) => Promise<WatchlistItemDetails[]>;
  removeFromWatchlist: (userId: string, itemId: string) => Promise<void>;
  isInWatchlist: (userId: string, symbol: string) => Promise<boolean>;
};

/**
 * Create Watchlist Service
 * Factory function for creating watchlist service instance
 */
export const createWatchlistService = (
  repository: WatchlistRepository,
  marketData: MarketDataService
): WatchlistService => ({
  /**
   * Add a cryptocurrency to user's watchlist
   */
  addToWatchlist: async (userId: string, data: AddToWatchlistDto) => {
    try {
      // Check if already exists
      const exists = await repository.exists(userId, data.symbol);
      if (exists) {
        throw new Error('Symbol already in watchlist');
      }

      // Create watchlist item
      const item = await repository.create({
        user: { connect: { id: userId } },
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        notes: data.notes,
      });

      logger.info(`Added ${data.symbol} to watchlist for user ${userId}`);
      return item;
    } catch (error) {
      logger.error('Error adding to watchlist:', error);
      throw error;
    }
  },

  /**
   * Get user's watchlist with current prices and market data
   */
  getWatchlist: async (userId: string) => {
    try {
      const items = await repository.findAll(userId);

      if (items.length === 0) {
        return [];
      }

      // Get current prices for all symbols
      const symbols = items.map((item) => item.symbol);
      const priceDataMap = await marketData.getCurrentPrices(symbols);

      // Combine watchlist items with current market data
      const itemsWithPrices: WatchlistItemDetails[] = items.map((item) => {
        const priceData = priceDataMap.get(item.symbol);

        if (!priceData) {
          // Return item with default values if price data not available
          return {
            id: item.id,
            userId: item.userId,
            symbol: item.symbol,
            name: item.name,
            currentPrice: 0,
            change1h: 0,
            change24h: 0,
            change7d: 0,
            volume24h: 0,
            marketCap: 0,
            trend: 'neutral' as const,
            notes: item.notes,
            addedAt: item.addedAt,
          };
        }

        return {
          id: item.id,
          userId: item.userId,
          symbol: item.symbol,
          name: item.name,
          currentPrice: priceData.price,
          change1h: priceData.change1h,
          change24h: priceData.change24h,
          change7d: priceData.change7d,
          volume24h: priceData.volume24h,
          marketCap: priceData.marketCap,
          trend: calculateTrend(priceData.change24h),
          notes: item.notes,
          addedAt: item.addedAt,
        };
      });

      return itemsWithPrices;
    } catch (error) {
      logger.error(`Error getting watchlist for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Remove a cryptocurrency from user's watchlist
   */
  removeFromWatchlist: async (userId: string, itemId: string) => {
    try {
      // Verify ownership
      const item = await repository.findById(itemId);
      if (!item) {
        throw new Error('Watchlist item not found');
      }

      if (item.userId !== userId) {
        throw new Error('Unauthorized: Cannot remove watchlist item');
      }

      await repository.delete(itemId);
      logger.info(`Removed watchlist item ${itemId} for user ${userId}`);
    } catch (error) {
      logger.error('Error removing from watchlist:', error);
      throw error;
    }
  },

  /**
   * Check if a symbol is in user's watchlist
   */
  isInWatchlist: async (userId: string, symbol: string) => {
    try {
      return await repository.exists(userId, symbol);
    } catch (error) {
      logger.error('Error checking watchlist:', error);
      throw error;
    }
  },
});
