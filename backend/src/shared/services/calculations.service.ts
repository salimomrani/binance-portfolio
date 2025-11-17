// T055: Shared calculations service for portfolio math

import Decimal from 'decimal.js';

export interface GainLossResult {
  amount: Decimal;
  percentage: Decimal;
  isProfit: boolean;
}

export interface AllocationData {
  symbol: string;
  value: Decimal;
  percentage: Decimal;
}

export interface Transaction {
  type: 'BUY' | 'SELL';
  quantity: Decimal;
  pricePerUnit: Decimal;
}

export class CalculationsService {
  /**
   * Calculate weighted average cost basis from transactions
   * Formula: Sum(quantity * price) / Sum(quantity)
   */
  calculateAverageCost(transactions: Transaction[]): Decimal {
    const buyTransactions = transactions.filter(t => t.type === 'BUY');

    if (buyTransactions.length === 0) {
      return new Decimal(0);
    }

    const totalCost = buyTransactions.reduce(
      (sum, t) => sum.plus(t.quantity.times(t.pricePerUnit)),
      new Decimal(0)
    );

    const totalQuantity = buyTransactions.reduce((sum, t) => sum.plus(t.quantity), new Decimal(0));

    if (totalQuantity.equals(0)) {
      return new Decimal(0);
    }

    return totalCost.dividedBy(totalQuantity);
  }

  /**
   * Calculate gain/loss for a holding
   * @param quantity - Current quantity held
   * @param avgCost - Average cost per unit
   * @param currentPrice - Current market price
   * @returns Gain/loss amount, percentage, and profit flag
   */
  calculateGainLoss(quantity: Decimal, avgCost: Decimal, currentPrice: Decimal): GainLossResult {
    const currentValue = quantity.times(currentPrice);
    const costBasis = quantity.times(avgCost);
    const gainLossAmount = currentValue.minus(costBasis);

    let gainLossPercentage = new Decimal(0);
    if (!costBasis.equals(0)) {
      gainLossPercentage = gainLossAmount.dividedBy(costBasis).times(100);
    }

    return {
      amount: gainLossAmount,
      percentage: gainLossPercentage,
      isProfit: gainLossAmount.greaterThan(0),
    };
  }

  /**
   * Calculate portfolio allocation percentages
   * @param holdings - Array of holdings with symbols and quantities
   * @param prices - Map of symbol to current price
   * @returns Array of allocation data with percentages
   */
  calculateAllocation(
    holdings: Array<{ symbol: string; quantity: Decimal }>,
    prices: Map<string, Decimal>
  ): AllocationData[] {
    // Calculate total portfolio value
    const totalValue = holdings.reduce((sum, h) => {
      const price = prices.get(h.symbol) || new Decimal(0);
      return sum.plus(h.quantity.times(price));
    }, new Decimal(0));

    if (totalValue.equals(0)) {
      return holdings.map(h => ({
        symbol: h.symbol,
        value: new Decimal(0),
        percentage: new Decimal(0),
      }));
    }

    // Calculate allocation for each holding
    return holdings.map(h => {
      const price = prices.get(h.symbol) || new Decimal(0);
      const value = h.quantity.times(price);
      const percentage = value.dividedBy(totalValue).times(100);

      return {
        symbol: h.symbol,
        value,
        percentage: percentage.toDecimalPlaces(2),
      };
    });
  }

  /**
   * Calculate portfolio total gain/loss
   */
  calculatePortfolioGainLoss(
    holdings: Array<{ quantity: Decimal; averageCost: Decimal }>,
    prices: Map<string, Decimal>,
    symbols: string[]
  ): GainLossResult {
    let totalCurrentValue = new Decimal(0);
    let totalCostBasis = new Decimal(0);

    holdings.forEach((holding, index) => {
      const symbol = symbols[index];
      const price = prices.get(symbol) || new Decimal(0);

      totalCurrentValue = totalCurrentValue.plus(holding.quantity.times(price));
      totalCostBasis = totalCostBasis.plus(holding.quantity.times(holding.averageCost));
    });

    const gainLossAmount = totalCurrentValue.minus(totalCostBasis);

    let gainLossPercentage = new Decimal(0);
    if (!totalCostBasis.equals(0)) {
      gainLossPercentage = gainLossAmount.dividedBy(totalCostBasis).times(100);
    }

    return {
      amount: gainLossAmount,
      percentage: gainLossPercentage,
      isProfit: gainLossAmount.greaterThan(0),
    };
  }

  /**
   * Format gain/loss value with color indicator
   */
  formatGainLoss(value: Decimal): {
    formatted: string;
    color: 'green' | 'red' | 'gray';
    arrow: '↑' | '↓' | '→';
  } {
    if (value.greaterThan(0)) {
      return {
        formatted: `+${value.toFixed(2)}`,
        color: 'green',
        arrow: '↑',
      };
    } else if (value.lessThan(0)) {
      return {
        formatted: value.toFixed(2),
        color: 'red',
        arrow: '↓',
      };
    } else {
      return {
        formatted: '0.00',
        color: 'gray',
        arrow: '→',
      };
    }
  }

  /**
   * Format market cap value (e.g., "$1.2T", "$45.3B")
   */
  formatMarketCap(value: Decimal): string {
    const trillion = new Decimal(1_000_000_000_000);
    const billion = new Decimal(1_000_000_000);
    const million = new Decimal(1_000_000);

    if (value.greaterThanOrEqualTo(trillion)) {
      return `$${value.dividedBy(trillion).toFixed(2)}T`;
    } else if (value.greaterThanOrEqualTo(billion)) {
      return `$${value.dividedBy(billion).toFixed(2)}B`;
    } else if (value.greaterThanOrEqualTo(million)) {
      return `$${value.dividedBy(million).toFixed(2)}M`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  }

  /**
   * Format volume value
   */
  formatVolume(value: Decimal): string {
    return this.formatMarketCap(value);
  }

  /**
   * Calculate trend indicator based on 24h change
   * @param change24h - 24h percentage change
   * @returns Trend indicator: 'up', 'down', or 'neutral'
   */
  calculateTrend(change24h: Decimal): 'up' | 'down' | 'neutral' {
    const threshold = new Decimal(0.5); // 0.5% threshold

    if (change24h.greaterThan(threshold)) {
      return 'up';
    } else if (change24h.lessThan(threshold.negated())) {
      return 'down';
    } else {
      return 'neutral';
    }
  }
}
