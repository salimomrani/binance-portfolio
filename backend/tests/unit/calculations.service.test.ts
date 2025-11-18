/**
 * T100: Unit tests for CalculationsService
 * Tests:
 * - calculateAverageCost with multiple transactions
 * - calculateGainLoss with profit and loss scenarios
 * - Edge cases (zero cost basis, very small values)
 */

import Decimal from 'decimal.js';
import { CalculationsService } from '../../src/shared/services/calculations.service';

describe('CalculationsService', () => {
  let service: CalculationsService;

  beforeEach(() => {
    service = new CalculationsService();
  });

  describe('calculateAverageCost', () => {
    it('should calculate average cost for single buy transaction', () => {
      const transactions = [
        {
          type: 'BUY' as const,
          quantity: new Decimal(1),
          pricePerUnit: new Decimal(50000),
        },
      ];

      const avgCost = service.calculateAverageCost(transactions);
      expect(avgCost.toNumber()).toBe(50000);
    });

    it('should calculate weighted average cost for multiple buy transactions', () => {
      const transactions = [
        {
          type: 'BUY' as const,
          quantity: new Decimal(1),
          pricePerUnit: new Decimal(40000),
        },
        {
          type: 'BUY' as const,
          quantity: new Decimal(1),
          pricePerUnit: new Decimal(60000),
        },
      ];

      const avgCost = service.calculateAverageCost(transactions);
      // (1*40000 + 1*60000) / 2 = 50000
      expect(avgCost.toNumber()).toBe(50000);
    });

    it('should calculate weighted average with different quantities', () => {
      const transactions = [
        {
          type: 'BUY' as const,
          quantity: new Decimal(2),
          pricePerUnit: new Decimal(1000),
        },
        {
          type: 'BUY' as const,
          quantity: new Decimal(1),
          pricePerUnit: new Decimal(2000),
        },
      ];

      const avgCost = service.calculateAverageCost(transactions);
      // (2*1000 + 1*2000) / 3 = 4000/3 = 1333.33...
      expect(avgCost.toFixed(2)).toBe('1333.33');
    });

    it('should ignore SELL transactions in average cost calculation', () => {
      const transactions = [
        {
          type: 'BUY' as const,
          quantity: new Decimal(2),
          pricePerUnit: new Decimal(1000),
        },
        {
          type: 'SELL' as const,
          quantity: new Decimal(1),
          pricePerUnit: new Decimal(1500),
        },
      ];

      const avgCost = service.calculateAverageCost(transactions);
      // Should only consider the BUY transaction
      expect(avgCost.toNumber()).toBe(1000);
    });

    it('should return zero for empty transaction array', () => {
      const transactions: any[] = [];
      const avgCost = service.calculateAverageCost(transactions);
      expect(avgCost.toNumber()).toBe(0);
    });

    it('should return zero when only SELL transactions exist', () => {
      const transactions = [
        {
          type: 'SELL' as const,
          quantity: new Decimal(1),
          pricePerUnit: new Decimal(50000),
        },
      ];

      const avgCost = service.calculateAverageCost(transactions);
      expect(avgCost.toNumber()).toBe(0);
    });

    it('should handle very small quantities and prices', () => {
      const transactions = [
        {
          type: 'BUY' as const,
          quantity: new Decimal(0.00000001),
          pricePerUnit: new Decimal(0.00000001),
        },
      ];

      const avgCost = service.calculateAverageCost(transactions);
      expect(avgCost.toNumber()).toBe(0.00000001);
    });
  });

  describe('calculateGainLoss', () => {
    it('should calculate profit correctly', () => {
      const quantity = new Decimal(1);
      const avgCost = new Decimal(40000);
      const currentPrice = new Decimal(50000);

      const result = service.calculateGainLoss(quantity, avgCost, currentPrice);

      expect(result.amount.toNumber()).toBe(10000); // 50000 - 40000
      expect(result.percentage.toFixed(2)).toBe('25.00'); // (10000 / 40000) * 100
      expect(result.isProfit).toBe(true);
    });

    it('should calculate loss correctly', () => {
      const quantity = new Decimal(1);
      const avgCost = new Decimal(50000);
      const currentPrice = new Decimal(40000);

      const result = service.calculateGainLoss(quantity, avgCost, currentPrice);

      expect(result.amount.toNumber()).toBe(-10000); // 40000 - 50000
      expect(result.percentage.toFixed(2)).toBe('-20.00'); // (-10000 / 50000) * 100
      expect(result.isProfit).toBe(false);
    });

    it('should handle zero gain/loss', () => {
      const quantity = new Decimal(1);
      const avgCost = new Decimal(50000);
      const currentPrice = new Decimal(50000);

      const result = service.calculateGainLoss(quantity, avgCost, currentPrice);

      expect(result.amount.toNumber()).toBe(0);
      expect(result.percentage.toNumber()).toBe(0);
      expect(result.isProfit).toBe(false);
    });

    it('should handle zero cost basis', () => {
      const quantity = new Decimal(1);
      const avgCost = new Decimal(0);
      const currentPrice = new Decimal(50000);

      const result = service.calculateGainLoss(quantity, avgCost, currentPrice);

      expect(result.amount.toNumber()).toBe(50000);
      expect(result.percentage.toNumber()).toBe(0); // Avoid division by zero
      expect(result.isProfit).toBe(true);
    });

    it('should handle very small values correctly', () => {
      const quantity = new Decimal(0.00000001);
      const avgCost = new Decimal(0.00000001);
      const currentPrice = new Decimal(0.00000002);

      const result = service.calculateGainLoss(quantity, avgCost, currentPrice);

      expect(result.amount.toFixed(16)).toBe('0.0000000000000001');
      expect(result.percentage.toNumber()).toBe(100);
      expect(result.isProfit).toBe(true);
    });

    it('should handle large quantities', () => {
      const quantity = new Decimal(1000000);
      const avgCost = new Decimal(1);
      const currentPrice = new Decimal(1.5);

      const result = service.calculateGainLoss(quantity, avgCost, currentPrice);

      expect(result.amount.toNumber()).toBe(500000); // 1000000 * 0.5
      expect(result.percentage.toNumber()).toBe(50);
      expect(result.isProfit).toBe(true);
    });

    it('should maintain precision with decimal values', () => {
      const quantity = new Decimal(1.23456789);
      const avgCost = new Decimal(1234.56789012);
      const currentPrice = new Decimal(2000.12345678);

      const result = service.calculateGainLoss(quantity, avgCost, currentPrice);

      // Current value: 1.23456789 * 2000.12345678 = 2469.2882...
      // Cost basis: 1.23456789 * 1234.56789012 = 1524.1579...
      // Gain/loss: 2469.2882... - 1524.1579... = 945.1303...
      expect(result.amount.toFixed(4)).toBe('945.1303');
      expect(result.isProfit).toBe(true);
    });
  });

  describe('formatGainLoss', () => {
    it('should format positive value with green color and up arrow', () => {
      const value = new Decimal(1234.56);
      const result = service.formatGainLoss(value);

      expect(result.formatted).toBe('+1234.56');
      expect(result.color).toBe('green');
      expect(result.arrow).toBe('↑');
    });

    it('should format negative value with red color and down arrow', () => {
      const value = new Decimal(-1234.56);
      const result = service.formatGainLoss(value);

      expect(result.formatted).toBe('-1234.56');
      expect(result.color).toBe('red');
      expect(result.arrow).toBe('↓');
    });

    it('should format zero with gray color and neutral arrow', () => {
      const value = new Decimal(0);
      const result = service.formatGainLoss(value);

      expect(result.formatted).toBe('0.00');
      expect(result.color).toBe('gray');
      expect(result.arrow).toBe('→');
    });

    it('should format very small positive value correctly', () => {
      const value = new Decimal(0.01);
      const result = service.formatGainLoss(value);

      expect(result.formatted).toBe('+0.01');
      expect(result.color).toBe('green');
      expect(result.arrow).toBe('↑');
    });

    it('should round to 2 decimal places', () => {
      const value = new Decimal(1234.567);
      const result = service.formatGainLoss(value);

      expect(result.formatted).toBe('+1234.57');
    });
  });

  describe('calculateAllocation', () => {
    it('should calculate allocation percentages correctly', () => {
      const holdings = [
        { symbol: 'BTC', quantity: new Decimal(1) },
        { symbol: 'ETH', quantity: new Decimal(10) },
      ];

      const prices = new Map([
        ['BTC', new Decimal(50000)], // Value: 50000
        ['ETH', new Decimal(3000)], // Value: 30000
      ]);

      const result = service.calculateAllocation(holdings, prices);

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('BTC');
      expect(result[0].percentage.toNumber()).toBe(62.50); // 50000/80000 * 100
      expect(result[1].symbol).toBe('ETH');
      expect(result[1].percentage.toNumber()).toBe(37.50); // 30000/80000 * 100
    });

    it('should handle zero total value', () => {
      const holdings = [
        { symbol: 'BTC', quantity: new Decimal(0) },
        { symbol: 'ETH', quantity: new Decimal(0) },
      ];

      const prices = new Map([
        ['BTC', new Decimal(50000)],
        ['ETH', new Decimal(3000)],
      ]);

      const result = service.calculateAllocation(holdings, prices);

      expect(result).toHaveLength(2);
      expect(result[0].percentage.toNumber()).toBe(0);
      expect(result[1].percentage.toNumber()).toBe(0);
    });

    it('should handle missing prices', () => {
      const holdings = [
        { symbol: 'BTC', quantity: new Decimal(1) },
        { symbol: 'UNKNOWN', quantity: new Decimal(100) },
      ];

      const prices = new Map([['BTC', new Decimal(50000)]]);

      const result = service.calculateAllocation(holdings, prices);

      expect(result).toHaveLength(2);
      expect(result[0].percentage.toNumber()).toBe(100); // Only BTC has value
      expect(result[1].percentage.toNumber()).toBe(0); // UNKNOWN has no price
    });
  });

  describe('Edge Cases', () => {
    it('should handle Decimal precision correctly', () => {
      const quantity = new Decimal('0.12345678');
      const avgCost = new Decimal('1234.56789012');
      const currentPrice = new Decimal('2000.00000000');

      const result = service.calculateGainLoss(quantity, avgCost, currentPrice);

      // Verify no precision loss
      expect(result.amount.toString()).not.toBe('NaN');
      expect(result.percentage.toString()).not.toBe('NaN');
    });

    it('should handle maximum Decimal values', () => {
      const quantity = new Decimal('999999999.99999999');
      const avgCost = new Decimal('999999999.99999999');
      const currentPrice = new Decimal('1000000000.00000000');

      const result = service.calculateGainLoss(quantity, avgCost, currentPrice);

      expect(result.isProfit).toBe(true);
      expect(result.amount.greaterThan(0)).toBe(true);
    });
  });
});
