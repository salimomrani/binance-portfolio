// T063: Portfolio service implementation

import { PrismaClient, Portfolio } from '@prisma/client';
import Decimal from 'decimal.js';
import { CreatePortfolioDto, UpdatePortfolioDto } from './portfolio.validation';
import { PortfolioSummary, PortfolioDetails, PortfolioStatistics } from './portfolio.types';
import { MarketDataService } from '../market-data/market-data.service';
import { CalculationsService } from '../../shared/services/calculations.service';
import { logger } from '../../shared/services/logger.service';

export class PortfolioService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly marketData: MarketDataService,
    private readonly calculations: CalculationsService
  ) {}

  /**
   * Create a new portfolio for a user
   */
  async createPortfolio(userId: string, data: CreatePortfolioDto): Promise<Portfolio> {
    try {
      const portfolio = await this.prisma.portfolio.create({
        data: {
          userId,
          name: data.name,
          description: data.description,
        },
      });

      logger.info(`Created portfolio ${portfolio.id} for user ${userId}`);
      return portfolio;
    } catch (error) {
      logger.error('Error creating portfolio:', error);
      throw error;
    }
  }

  /**
   * Get all portfolios for a user with summary data
   */
  async getPortfolios(userId: string): Promise<PortfolioSummary[]> {
    try {
      const portfolios = await this.prisma.portfolio.findMany({
        where: { userId },
        include: {
          holdings: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const summaries = await Promise.all(
        portfolios.map(async portfolio => {
          const summary = await this.calculatePortfolioSummary(portfolio.id);
          return {
            id: portfolio.id,
            name: portfolio.name,
            description: portfolio.description,
            isDefault: portfolio.isDefault,
            holdingsCount: portfolio.holdings.length,
            createdAt: portfolio.createdAt,
            ...summary,
          };
        })
      );

      return summaries;
    } catch (error) {
      logger.error(`Error getting portfolios for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get portfolio details with all holdings
   */
  async getPortfolioById(portfolioId: string): Promise<PortfolioDetails> {
    try {
      const portfolio = await this.prisma.portfolio.findUnique({
        where: { id: portfolioId },
        include: {
          holdings: true,
        },
      });

      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      // Get current prices for all holdings
      const symbols = portfolio.holdings.map(h => h.symbol);
      const prices = symbols.length > 0
        ? await this.marketData.getMultiplePrices(symbols)
        : new Map();

      // Calculate total portfolio value
      let totalValue = new Decimal(0);
      let totalCostBasis = new Decimal(0);

      const holdings = portfolio.holdings.map(holding => {
        const currentPrice = prices.get(holding.symbol)?.price || 0;
        const quantity = new Decimal(holding.quantity);
        const avgCost = new Decimal(holding.averageCost);
        const currentValue = quantity.times(currentPrice);
        const costBasis = quantity.times(avgCost);

        totalValue = totalValue.plus(currentValue);
        totalCostBasis = totalCostBasis.plus(costBasis);

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
          allocationPercentage: 0, // Calculated below
          priceChange24h: prices.get(holding.symbol)?.change24h || 0,
          notes: holding.notes,
          lastUpdated: new Date(),
        };
      });

      // Calculate allocation percentages
      holdings.forEach(holding => {
        if (!totalValue.equals(0)) {
          holding.allocationPercentage = new Decimal(holding.currentValue)
            .dividedBy(totalValue)
            .times(100)
            .toDecimalPlaces(2)
            .toNumber();
        }
      });

      const totalGainLoss = totalValue.minus(totalCostBasis);
      const totalGainLossPercentage = !totalCostBasis.equals(0)
        ? totalGainLoss.dividedBy(totalCostBasis).times(100).toNumber()
        : 0;

      return {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        isDefault: portfolio.isDefault,
        totalValue: totalValue.toNumber(),
        totalGainLoss: totalGainLoss.toNumber(),
        totalGainLossPercentage,
        holdingsCount: holdings.length,
        lastUpdated: new Date(),
        createdAt: portfolio.createdAt,
        holdings,
      };
    } catch (error) {
      logger.error(`Error getting portfolio ${portfolioId}:`, error);
      throw error;
    }
  }

  /**
   * Update portfolio details
   */
  async updatePortfolio(portfolioId: string, data: UpdatePortfolioDto): Promise<Portfolio> {
    try {
      const portfolio = await this.prisma.portfolio.update({
        where: { id: portfolioId },
        data,
      });

      logger.info(`Updated portfolio ${portfolioId}`);
      return portfolio;
    } catch (error) {
      logger.error(`Error updating portfolio ${portfolioId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a portfolio
   */
  async deletePortfolio(portfolioId: string): Promise<void> {
    try {
      await this.prisma.portfolio.delete({
        where: { id: portfolioId },
      });

      logger.info(`Deleted portfolio ${portfolioId}`);
    } catch (error) {
      logger.error(`Error deleting portfolio ${portfolioId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate portfolio statistics
   */
  async calculatePortfolioStatistics(portfolioId: string): Promise<PortfolioStatistics> {
    try {
      const details = await this.getPortfolioById(portfolioId);

      let bestPerformer = null;
      let worstPerformer = null;
      let largestHolding = null;

      if (details.holdings.length > 0) {
        // Find best performer
        const best = details.holdings.reduce((prev, current) =>
          current.gainLossPercentage > prev.gainLossPercentage ? current : prev
        );
        bestPerformer = {
          symbol: best.symbol,
          gainLossPercentage: best.gainLossPercentage,
        };

        // Find worst performer
        const worst = details.holdings.reduce((prev, current) =>
          current.gainLossPercentage < prev.gainLossPercentage ? current : prev
        );
        worstPerformer = {
          symbol: worst.symbol,
          gainLossPercentage: worst.gainLossPercentage,
        };

        // Find largest holding
        const largest = details.holdings.reduce((prev, current) =>
          current.allocationPercentage > prev.allocationPercentage ? current : prev
        );
        largestHolding = {
          symbol: largest.symbol,
          percentage: largest.allocationPercentage,
        };
      }

      return {
        totalValue: details.totalValue,
        totalCostBasis: details.holdings.reduce((sum, h) => sum + h.costBasis, 0),
        totalGainLoss: details.totalGainLoss,
        totalGainLossPercentage: details.totalGainLossPercentage,
        bestPerformer,
        worstPerformer,
        largestHolding,
      };
    } catch (error) {
      logger.error(`Error calculating portfolio statistics ${portfolioId}:`, error);
      throw error;
    }
  }

  /**
   * Helper: Calculate portfolio summary (used by getPortfolios)
   */
  private async calculatePortfolioSummary(portfolioId: string): Promise<{
    totalValue: number;
    totalGainLoss: number;
    totalGainLossPercentage: number;
    lastUpdated: Date;
  }> {
    try {
      const holdings = await this.prisma.holding.findMany({
        where: { portfolioId },
      });

      if (holdings.length === 0) {
        return {
          totalValue: 0,
          totalGainLoss: 0,
          totalGainLossPercentage: 0,
          lastUpdated: new Date(),
        };
      }

      const symbols = holdings.map(h => h.symbol);
      const prices = await this.marketData.getMultiplePrices(symbols);

      let totalValue = new Decimal(0);
      let totalCostBasis = new Decimal(0);

      holdings.forEach(holding => {
        const currentPrice = prices.get(holding.symbol)?.price || 0;
        const quantity = new Decimal(holding.quantity);
        const avgCost = new Decimal(holding.averageCost);

        totalValue = totalValue.plus(quantity.times(currentPrice));
        totalCostBasis = totalCostBasis.plus(quantity.times(avgCost));
      });

      const totalGainLoss = totalValue.minus(totalCostBasis);
      const totalGainLossPercentage = !totalCostBasis.equals(0)
        ? totalGainLoss.dividedBy(totalCostBasis).times(100).toNumber()
        : 0;

      return {
        totalValue: totalValue.toNumber(),
        totalGainLoss: totalGainLoss.toNumber(),
        totalGainLossPercentage,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error(`Error calculating summary for portfolio ${portfolioId}:`, error);
      return {
        totalValue: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        lastUpdated: new Date(),
      };
    }
  }
}
