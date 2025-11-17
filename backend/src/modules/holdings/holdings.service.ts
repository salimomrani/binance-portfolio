// T064: Holdings service implementation

import { PrismaClient, Holding } from '@prisma/client';
import Decimal from 'decimal.js';
import { AddHoldingDto, UpdateHoldingDto } from './holdings.validation';
import { HoldingDetails } from '../portfolio/portfolio.types';
import { MarketDataService } from '../market-data/market-data.service';
import { CalculationsService } from '../../shared/services/calculations.service';
import { logger } from '../../shared/services/logger.service';

export class HoldingsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly marketData: MarketDataService,
    private readonly calculations: CalculationsService
  ) {}

  /**
   * Add a new holding to a portfolio
   */
  async addHolding(portfolioId: string, data: AddHoldingDto): Promise<Holding> {
    try {
      // Check if holding already exists
      const existing = await this.prisma.holding.findUnique({
        where: {
          portfolioId_symbol: {
            portfolioId,
            symbol: data.symbol,
          },
        },
      });

      if (existing) {
        throw new Error(`Holding for ${data.symbol} already exists in this portfolio`);
      }

      const holding = await this.prisma.holding.create({
        data: {
          portfolioId,
          symbol: data.symbol,
          name: data.name,
          quantity: new Decimal(data.quantity),
          averageCost: new Decimal(data.averageCost),
          notes: data.notes,
        },
      });

      logger.info(`Added holding ${holding.symbol} to portfolio ${portfolioId}`);
      return holding;
    } catch (error) {
      logger.error('Error adding holding:', error);
      throw error;
    }
  }

  /**
   * Get all holdings for a portfolio with current values
   */
  async getHoldings(
    portfolioId: string,
    sortBy?: 'symbol' | 'value' | 'gainLoss',
    order: 'asc' | 'desc' = 'asc'
  ): Promise<HoldingDetails[]> {
    try {
      const holdings = await this.prisma.holding.findMany({
        where: { portfolioId },
        orderBy: sortBy ? { [sortBy]: order } : { createdAt: 'asc' },
      });

      if (holdings.length === 0) {
        return [];
      }

      // Get current prices
      const symbols = holdings.map(h => h.symbol);
      const prices = await this.marketData.getMultiplePrices(symbols);

      // Calculate total portfolio value for allocation percentages
      let totalValue = new Decimal(0);
      const holdingValues = holdings.map(holding => {
        const currentPrice = prices.get(holding.symbol)?.price || 0;
        const quantity = new Decimal(holding.quantity);
        const value = quantity.times(currentPrice);
        totalValue = totalValue.plus(value);
        return value;
      });

      // Build holding details
      const details = holdings.map((holding, index) => {
        const currentPrice = prices.get(holding.symbol)?.price || 0;
        const quantity = new Decimal(holding.quantity);
        const avgCost = new Decimal(holding.averageCost);
        const currentValue = holdingValues[index];
        const costBasis = quantity.times(avgCost);

        const gainLoss = this.calculations.calculateGainLoss(quantity, avgCost, new Decimal(currentPrice));

        const allocationPercentage = !totalValue.equals(0)
          ? currentValue.dividedBy(totalValue).times(100).toDecimalPlaces(2).toNumber()
          : 0;

        const priceData = prices.get(holding.symbol);

        return {
          id: holding.id,
          symbol: holding.symbol,
          name: holding.name,
          quantity: quantity.toNumber(),
          averageCost: avgCost.toNumber(),
          currentPrice,
          currentValue: currentValue.toNumber(),
          costBasis: costBasis.toNumber(),
          gainLoss: gainLoss.amount.toNumber(),
          gainLossPercentage: gainLoss.percentage.toNumber(),
          allocationPercentage,
          priceChange24h: priceData?.change24h || 0,
          volume24h: priceData?.volume24h || 0,
          marketCap: priceData?.marketCap || 0,
          notes: holding.notes,
          lastUpdated: new Date(),
        };
      });

      // Apply custom sorting if requested
      if (sortBy === 'value') {
        details.sort((a, b) => {
          const diff = b.currentValue - a.currentValue;
          return order === 'asc' ? -diff : diff;
        });
      } else if (sortBy === 'gainLoss') {
        details.sort((a, b) => {
          const diff = b.gainLossPercentage - a.gainLossPercentage;
          return order === 'asc' ? -diff : diff;
        });
      }

      return details;
    } catch (error) {
      logger.error(`Error getting holdings for portfolio ${portfolioId}:`, error);
      throw error;
    }
  }

  /**
   * Get a single holding by ID with current values
   */
  async getHoldingById(holdingId: string): Promise<HoldingDetails> {
    try {
      const holding = await this.prisma.holding.findUnique({
        where: { id: holdingId },
      });

      if (!holding) {
        throw new Error('Holding not found');
      }

      return this.calculateHoldingValue(holding);
    } catch (error) {
      logger.error(`Error getting holding ${holdingId}:`, error);
      throw error;
    }
  }

  /**
   * Update a holding
   */
  async updateHolding(holdingId: string, data: UpdateHoldingDto): Promise<Holding> {
    try {
      const updateData: {
        quantity?: Decimal;
        averageCost?: Decimal;
        notes?: string;
      } = {};

      if (data.quantity !== undefined) {
        updateData.quantity = new Decimal(data.quantity);
      }
      if (data.averageCost !== undefined) {
        updateData.averageCost = new Decimal(data.averageCost);
      }
      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }

      const holding = await this.prisma.holding.update({
        where: { id: holdingId },
        data: updateData,
      });

      logger.info(`Updated holding ${holdingId}`);
      return holding;
    } catch (error) {
      logger.error(`Error updating holding ${holdingId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a holding
   */
  async deleteHolding(holdingId: string): Promise<void> {
    try {
      await this.prisma.holding.delete({
        where: { id: holdingId },
      });

      logger.info(`Deleted holding ${holdingId}`);
    } catch (error) {
      logger.error(`Error deleting holding ${holdingId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate holding value with current price
   */
  async calculateHoldingValue(holding: Holding): Promise<HoldingDetails> {
    try {
      const priceData = await this.marketData.getCurrentPrice(holding.symbol);
      const currentPrice = priceData.price;

      const quantity = new Decimal(holding.quantity);
      const avgCost = new Decimal(holding.averageCost);
      const currentValue = quantity.times(currentPrice);
      const costBasis = quantity.times(avgCost);

      const gainLoss = this.calculations.calculateGainLoss(quantity, avgCost, new Decimal(currentPrice));

      return {
        id: holding.id,
        symbol: holding.symbol,
        name: holding.name,
        quantity: quantity.toNumber(),
        averageCost: avgCost.toNumber(),
        currentPrice,
        currentValue: currentValue.toNumber(),
        costBasis: costBasis.toNumber(),
        gainLoss: gainLoss.amount.toNumber(),
        gainLossPercentage: gainLoss.percentage.toNumber(),
        allocationPercentage: 0, // Will be calculated in context of full portfolio
        priceChange24h: priceData.change24h,
        volume24h: priceData.volume24h,
        marketCap: priceData.marketCap,
        notes: holding.notes,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error(`Error calculating holding value for ${holding.id}:`, error);
      throw error;
    }
  }
}
