// Binance Earn sync service
// Syncs user's Binance Earn positions and rewards history

import { PrismaClient, EarnType } from '@prisma/client';
import Decimal from 'decimal.js';
import { BinanceAdapter } from '../market-data/binance.adapter';
import { logger } from '../../shared/services/logger.service';
import { EarnPosition, EarnReward } from '../market-data/binance-earn.types';

export interface EarnSyncResult {
  positionsAdded: number;
  positionsUpdated: number;
  totalPositions: number;
  rewardsAdded: number;
  errors: string[];
}

export interface EarningsSummary {
  totalPositions: number;
  totalValueUSD: number;
  flexibleCount: number;
  lockedCount: number;
  estimatedDailyEarnings: number;
  totalRewardsAllTime: number;
  totalRewardsLast30Days: number;
  byAsset: {
    asset: string;
    amount: number;
    apy: number;
    type: EarnType;
    dailyEarnings?: number;
  }[];
}

/**
 * Earnings Service Type
 */
export type EarningsService = {
  syncEarnPositions: (userId: string) => Promise<EarnSyncResult>;
  syncRewardsHistory: (userId: string, startTime?: number, endTime?: number) => Promise<number>;
  getEarningsSummary: (userId: string) => Promise<EarningsSummary>;
  getEarnPositions: (userId: string) => Promise<any[]>;
  getRewardsHistory: (userId: string, startDate?: Date, endDate?: Date, asset?: string) => Promise<any[]>;
};

/**
 * Create Earnings Service
 * Factory function for creating earnings service instance
 */
export const createEarningsService = (
  prisma: PrismaClient,
  binanceAdapter: BinanceAdapter
): EarningsService => ({
  /**
   * Sync earn positions from Binance
   * Fetches all flexible and locked positions and stores them in the database
   */
  syncEarnPositions: async (userId: string) => {
    const errors: string[] = [];
    let positionsAdded = 0;
    let positionsUpdated = 0;
    let rewardsAdded = 0;

    try {
      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Fetch all earn positions from Binance
      logger.info(`Fetching Binance Earn positions for user ${userId}`);
      const positions = await binanceAdapter.getAllEarnPositions();

      if (positions.length === 0) {
        logger.info('No earn positions found in Binance account');
        return {
          positionsAdded: 0,
          positionsUpdated: 0,
          totalPositions: 0,
          rewardsAdded: 0,
          errors: [],
        };
      }

      logger.info(`Found ${positions.length} earn positions in Binance account`);

      // Process each position
      for (const position of positions) {
        try {
          // Check if position already exists
          const existingPosition = await prisma.earnPosition.findUnique({
            where: {
              userId_productId_asset: {
                userId,
                productId: position.productId,
                asset: position.asset,
              },
            },
          });

          if (existingPosition) {
            // Update existing position
            await prisma.earnPosition.update({
              where: { id: existingPosition.id },
              data: {
                amount: new Decimal(position.amount),
                currentApy: new Decimal(position.currentApy),
                dailyEarnings: position.dailyEarnings
                  ? new Decimal(position.dailyEarnings)
                  : null,
                lockPeriod: position.lockPeriod,
                lockedUntil: position.lockedUntil,
                canRedeem: position.canRedeem,
                autoSubscribe: position.autoSubscribe,
                lastSyncedAt: new Date(),
              },
            });
            positionsUpdated++;
            logger.info(
              `Updated ${position.type} position ${position.asset}: ${position.amount} @ ${position.currentApy}% APY`
            );
          } else {
            // Create new position
            await prisma.earnPosition.create({
              data: {
                userId,
                asset: position.asset,
                productId: position.productId,
                productName: position.productName,
                type: position.type as EarnType,
                amount: new Decimal(position.amount),
                currentApy: new Decimal(position.currentApy),
                dailyEarnings: position.dailyEarnings
                  ? new Decimal(position.dailyEarnings)
                  : null,
                lockPeriod: position.lockPeriod,
                lockedUntil: position.lockedUntil,
                canRedeem: position.canRedeem,
                autoSubscribe: position.autoSubscribe,
              },
            });
            positionsAdded++;
            logger.info(
              `Added new ${position.type} position ${position.asset}: ${position.amount} @ ${position.currentApy}% APY`
            );
          }
        } catch (error) {
          const errorMsg = `Failed to process position ${position.asset}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // Delete positions that no longer exist in Binance
      const currentPositionKeys = positions.map(
        p => `${p.productId}-${p.asset}`
      );
      const existingPositions = await prisma.earnPosition.findMany({
        where: { userId },
      });

      for (const existing of existingPositions) {
        const key = `${existing.productId}-${existing.asset}`;
        if (!currentPositionKeys.includes(key)) {
          await prisma.earnPosition.delete({
            where: { id: existing.id },
          });
          logger.info(
            `Deleted position ${existing.asset} (no longer in Binance account)`
          );
        }
      }

      logger.info(
        `Earn positions sync completed: ${positionsAdded} added, ${positionsUpdated} updated`
      );

      return {
        positionsAdded,
        positionsUpdated,
        totalPositions: positionsAdded + positionsUpdated,
        rewardsAdded,
        errors,
      };
    } catch (error) {
      logger.error('Binance Earn sync failed:', error);
      throw error;
    }
  },

  /**
   * Sync rewards history from Binance
   * Fetches rewards for the specified time period
   */
  syncRewardsHistory: async (userId: string, startTime?: number, endTime?: number) => {
    try {
      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Fetch all rewards history from Binance
      logger.info(`Fetching Binance Earn rewards history for user ${userId}`);
      const rewards = await binanceAdapter.getAllRewardsHistory(
        undefined,
        startTime,
        endTime
      );

      if (rewards.length === 0) {
        logger.info('No rewards found in Binance Earn history');
        return 0;
      }

      logger.info(`Found ${rewards.length} rewards in Binance Earn history`);

      let rewardsAdded = 0;

      // Process each reward
      for (const reward of rewards) {
        try {
          // Find matching position if available
          const position = await prisma.earnPosition.findFirst({
            where: {
              userId,
              asset: reward.asset,
              productId: reward.positionId,
            },
          });

          // Check if reward already exists (to avoid duplicates)
          const existingReward = await prisma.earnReward.findFirst({
            where: {
              userId,
              asset: reward.asset,
              amount: new Decimal(reward.amount),
              rewardDate: reward.rewardDate,
              type: reward.type as EarnType,
            },
          });

          if (!existingReward) {
            await prisma.earnReward.create({
              data: {
                userId,
                positionId: position?.id,
                asset: reward.asset,
                amount: new Decimal(reward.amount),
                type: reward.type as EarnType,
                rewardDate: reward.rewardDate,
              },
            });
            rewardsAdded++;
          }
        } catch (error) {
          logger.error(
            `Failed to process reward for ${reward.asset}:`,
            error
          );
        }
      }

      logger.info(`Rewards sync completed: ${rewardsAdded} new rewards added`);
      return rewardsAdded;
    } catch (error) {
      logger.error('Binance rewards sync failed:', error);
      throw error;
    }
  },

  /**
   * Get earnings summary for a user
   */
  getEarningsSummary: async (userId: string) => {
    try {
      // Get all positions
      const positions = await prisma.earnPosition.findMany({
        where: { userId },
      });

      // Get rewards from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const rewardsLast30Days = await prisma.earnReward.findMany({
        where: {
          userId,
          rewardDate: {
            gte: thirtyDaysAgo,
          },
        },
      });

      // Get all-time rewards
      const allRewards = await prisma.earnReward.findMany({
        where: { userId },
      });

      // Calculate summary
      const flexibleCount = positions.filter((p) => p.type === 'FLEXIBLE').length;
      const lockedCount = positions.filter((p) => p.type === 'LOCKED').length;

      const totalRewardsLast30Days = rewardsLast30Days.reduce(
        (sum, r) => sum + r.amount.toNumber(),
        0
      );

      const totalRewardsAllTime = allRewards.reduce(
        (sum, r) => sum + r.amount.toNumber(),
        0
      );

      const estimatedDailyEarnings = positions.reduce((sum, p) => {
        return sum + (p.dailyEarnings?.toNumber() || 0);
      }, 0);

      // Group by asset
      const byAsset = positions.map((p) => ({
        asset: p.asset,
        amount: p.amount.toNumber(),
        apy: p.currentApy.toNumber(),
        type: p.type,
        dailyEarnings: p.dailyEarnings?.toNumber(),
      }));

      return {
        totalPositions: positions.length,
        totalValueUSD: 0, // TODO: Calculate based on current prices
        flexibleCount,
        lockedCount,
        estimatedDailyEarnings,
        totalRewardsAllTime,
        totalRewardsLast30Days,
        byAsset,
      };
    } catch (error) {
      logger.error('Failed to get earnings summary:', error);
      throw error;
    }
  },

  /**
   * Get all earn positions for a user
   */
  getEarnPositions: async (userId: string) => {
    return prisma.earnPosition.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { asset: 'asc' }],
    });
  },

  /**
   * Get rewards history for a user
   */
  getRewardsHistory: async (
    userId: string,
    startDate?: Date,
    endDate?: Date,
    asset?: string
  ) => {
    return prisma.earnReward.findMany({
      where: {
        userId,
        ...(startDate && { rewardDate: { gte: startDate } }),
        ...(endDate && { rewardDate: { lte: endDate } }),
        ...(asset && { asset }),
      },
      orderBy: { rewardDate: 'desc' },
    });
  },
});
