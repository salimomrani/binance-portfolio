// Binance portfolio sync service
// Syncs user's Binance account balances to create/update portfolio

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { BinanceAdapter } from '../market-data/binance.adapter';
import { MarketDataService } from '../market-data/market-data.service';
import { logger } from '../../shared/services/logger.service';
import { filterValidSymbols, getSymbolFilterReason } from '../../shared/utils/crypto-symbol.util';

export interface SyncResult {
  portfolioId: string;
  portfolioName: string;
  holdingsAdded: number;
  holdingsUpdated: number;
  totalHoldings: number;
  errors: string[];
}

export class BinanceSyncService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly binanceAdapter: BinanceAdapter,
    private readonly marketData: MarketDataService
  ) {}

  /**
   * Sync portfolio from Binance account
   * Creates or updates a portfolio named "Binance Portfolio" with current balances
   */
  async syncFromBinance(userId: string): Promise<SyncResult> {
    const errors: string[] = [];
    let holdingsAdded = 0;
    let holdingsUpdated = 0;

    try {
      // Validate user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found. Please ensure the user exists in the database.`);
      }

      // Fetch balances from Binance
      logger.info(`Fetching Binance balances for user ${userId}`);
      const balances = await this.binanceAdapter.getAccountBalances();

      if (balances.length === 0) {
        throw new Error('No balances found in Binance account');
      }

      logger.info(`Found ${balances.length} non-zero balances in Binance account`);

      // Find or create "Binance Portfolio"
      let portfolio = await this.prisma.portfolio.findFirst({
        where: {
          userId,
          name: 'Binance Portfolio',
        },
        include: {
          holdings: true,
        },
      });

      if (!portfolio) {
        logger.info('Creating new Binance Portfolio');
        portfolio = await this.prisma.portfolio.create({
          data: {
            userId,
            name: 'Binance Portfolio',
            description: 'Automatically synced from Binance account',
            isDefault: true,
          },
          include: {
            holdings: true,
          },
        });
      }

      // Get all symbols from balances
      const allSymbols = balances.map(b => b.asset);

      // Filter out invalid symbols (Binance-specific tokens, stablecoins, etc.)
      const validSymbols = filterValidSymbols(allSymbols);

      logger.info(`Found ${allSymbols.length} total symbols, ${validSymbols.length} valid for price fetching`);

      // Fetch current prices for valid symbols only
      const prices = validSymbols.length > 0
        ? await this.marketData.getMultiplePrices(validSymbols)
        : new Map();

      // Process each balance
      for (const balance of balances) {
        const symbol = balance.asset;
        const totalQuantity = parseFloat(balance.free) + parseFloat(balance.locked);

        // Skip if quantity is effectively zero
        if (totalQuantity < 0.00000001) {
          continue;
        }

        try {
          // Check if symbol was filtered out
          if (!validSymbols.includes(symbol)) {
            const reason = getSymbolFilterReason(symbol);
            logger.info(`Skipping ${symbol} (${totalQuantity}): ${reason}`);
            // Don't add filtered symbols to errors - this is expected behavior
            continue;
          }

          // Get current price - try from batch fetch first
          let priceData = prices.get(symbol);

          // If no price data from batch fetch (likely no USDT pair), try individual fetch with fallback
          if (!priceData) {
            logger.info(`No USDT pair for ${symbol}, trying individual price fetch with fallback`);
            try {
              priceData = await this.marketData.getCurrentPrice(symbol);
              logger.info(`Successfully fetched price for ${symbol} using fallback: $${priceData.price}`);
            } catch (fallbackError) {
              logger.warn(`Failed to fetch price for ${symbol} even with fallback:`, fallbackError);
              errors.push(`No price data available for ${symbol} (no USDT pair and fallback failed)`);
              continue;
            }
          }

          const currentPrice = priceData.price;
          const name = priceData.name;

          // Check if holding already exists
          const existingHolding = await this.prisma.holding.findUnique({
            where: {
              portfolioId_symbol: {
                portfolioId: portfolio.id,
                symbol,
              },
            },
          });

          if (existingHolding) {
            // Update existing holding with new quantity
            // Keep the existing average cost (user can manually adjust if needed)
            await this.prisma.holding.update({
              where: { id: existingHolding.id },
              data: {
                quantity: new Decimal(totalQuantity),
                // Optionally update average cost to current price if you want to reset cost basis:
                // averageCost: new Decimal(currentPrice),
              },
            });
            holdingsUpdated++;
            logger.info(`Updated holding ${symbol}: ${totalQuantity}`);
          } else {
            // Create new holding with current price as average cost
            await this.prisma.holding.create({
              data: {
                portfolioId: portfolio.id,
                symbol,
                name,
                quantity: new Decimal(totalQuantity),
                averageCost: new Decimal(currentPrice), // Use current price as initial cost
                notes: 'Synced from Binance',
              },
            });
            holdingsAdded++;
            logger.info(`Added new holding ${symbol}: ${totalQuantity}`);
          }
        } catch (error) {
          const errorMsg = `Failed to process ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // Delete holdings that no longer exist in Binance
      // This will remove holdings that were sold or transferred out
      const currentSymbols = balances.map(b => b.asset);
      const holdingsToDelete = portfolio.holdings.filter((h: { symbol: string }) => !currentSymbols.includes(h.symbol));

      for (const holding of holdingsToDelete) {
        await this.prisma.holding.delete({
          where: { id: holding.id },
        });
        logger.info(`Deleted holding ${holding.symbol} (no longer in Binance account)`);
      }

      logger.info(`Binance sync completed: ${holdingsAdded} added, ${holdingsUpdated} updated`);

      return {
        portfolioId: portfolio.id,
        portfolioName: portfolio.name,
        holdingsAdded,
        holdingsUpdated,
        totalHoldings: holdingsAdded + holdingsUpdated,
        errors,
      };
    } catch (error) {
      logger.error('Binance sync failed:', error);
      throw error;
    }
  }
}
