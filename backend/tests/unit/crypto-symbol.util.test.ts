/**
 * Unit tests for crypto symbol validation utility
 * Tests:
 * - isValidCryptoSymbol with valid and invalid symbols
 * - filterValidSymbols with mixed symbol arrays
 * - getSymbolFilterReason for various symbol types
 */

import { isValidCryptoSymbol, filterValidSymbols, getSymbolFilterReason } from '../../src/shared/utils/crypto-symbol.util';

describe('Crypto Symbol Validation Utility', () => {
  describe('isValidCryptoSymbol', () => {
    describe('valid symbols', () => {
      it('should accept standard cryptocurrency symbols', () => {
        expect(isValidCryptoSymbol('BTC')).toBe(true);
        expect(isValidCryptoSymbol('ETH')).toBe(true);
        expect(isValidCryptoSymbol('SOL')).toBe(true);
        expect(isValidCryptoSymbol('MATIC')).toBe(true);
      });

      it('should accept symbols regardless of case', () => {
        expect(isValidCryptoSymbol('btc')).toBe(true);
        expect(isValidCryptoSymbol('Eth')).toBe(true);
        expect(isValidCryptoSymbol('SoL')).toBe(true);
      });

      it('should accept symbols with numbers', () => {
        expect(isValidCryptoSymbol('1INCH')).toBe(true);
        expect(isValidCryptoSymbol('ALGO')).toBe(true);
      });
    });

    describe('invalid symbols - Binance specific prefixes', () => {
      it('should reject LD-prefixed symbols (Liquid Swap tokens)', () => {
        expect(isValidCryptoSymbol('LDBNB')).toBe(false);
        expect(isValidCryptoSymbol('LDETH')).toBe(false);
        expect(isValidCryptoSymbol('LDXRP')).toBe(false);
        expect(isValidCryptoSymbol('LDSOL')).toBe(false);
        expect(isValidCryptoSymbol('LDUSDC')).toBe(false);
      });

      it('should reject RW-prefixed symbols (wrapped tokens)', () => {
        expect(isValidCryptoSymbol('RWUSDT')).toBe(false);
        expect(isValidCryptoSymbol('RWBNB')).toBe(false);
      });

      it('should reject BS-prefixed symbols (Binance Savings)', () => {
        expect(isValidCryptoSymbol('BSBTC')).toBe(false);
        expect(isValidCryptoSymbol('BSETH')).toBe(false);
      });

      it('should reject BN-prefixed symbols', () => {
        expect(isValidCryptoSymbol('BNBTC')).toBe(false);
        expect(isValidCryptoSymbol('BNETH')).toBe(false);
      });
    });

    describe('invalid symbols - stablecoins', () => {
      it('should reject USDT (quote currency)', () => {
        expect(isValidCryptoSymbol('USDT')).toBe(false);
      });

      it('should reject other stablecoins used as quote currencies', () => {
        expect(isValidCryptoSymbol('USDC')).toBe(false);
        expect(isValidCryptoSymbol('BUSD')).toBe(false);
        expect(isValidCryptoSymbol('DAI')).toBe(false);
        expect(isValidCryptoSymbol('TUSD')).toBe(false);
        expect(isValidCryptoSymbol('USDP')).toBe(false);
        expect(isValidCryptoSymbol('FDUSD')).toBe(false);
      });
    });

    describe('invalid symbols - edge cases', () => {
      it('should reject empty strings', () => {
        expect(isValidCryptoSymbol('')).toBe(false);
      });

      it('should reject whitespace-only strings', () => {
        expect(isValidCryptoSymbol('   ')).toBe(false);
      });

      it('should handle symbols with leading/trailing whitespace', () => {
        expect(isValidCryptoSymbol('  BTC  ')).toBe(true);
        expect(isValidCryptoSymbol('  LDBNB  ')).toBe(false);
      });
    });
  });

  describe('filterValidSymbols', () => {
    it('should filter out invalid symbols from mixed array', () => {
      const symbols = [
        'BTC',
        'LDBNB',
        'ETH',
        'USDT',
        'SOL',
        'LDETH',
        'RWUSDT',
      ];

      const validSymbols = filterValidSymbols(symbols);

      expect(validSymbols).toEqual(['BTC', 'ETH', 'SOL']);
    });

    it('should return empty array when all symbols are invalid', () => {
      const symbols = ['LDBNB', 'LDETH', 'USDT', 'BUSD'];
      const validSymbols = filterValidSymbols(symbols);

      expect(validSymbols).toEqual([]);
    });

    it('should return all symbols when all are valid', () => {
      const symbols = ['BTC', 'ETH', 'SOL', 'MATIC'];
      const validSymbols = filterValidSymbols(symbols);

      expect(validSymbols).toEqual(['BTC', 'ETH', 'SOL', 'MATIC']);
    });

    it('should handle empty array', () => {
      const validSymbols = filterValidSymbols([]);
      expect(validSymbols).toEqual([]);
    });

    it('should preserve order of valid symbols', () => {
      const symbols = ['SOL', 'LDBNB', 'BTC', 'USDT', 'ETH'];
      const validSymbols = filterValidSymbols(symbols);

      expect(validSymbols).toEqual(['SOL', 'BTC', 'ETH']);
    });

    it('should handle real-world Binance balance example', () => {
      const symbols = [
        'USDC',
        'LDBNB',
        'LDETH',
        'LDXRP',
        'LDUSD C',
        'LDFET',
        'LDSOL',
        'SUI',
        'LDWBETH',
        'POL',
        'LDBNSOL',
        'LDSIGN',
        'RWUSDT',
        'LDKITE',
        'LDSAPIEN',
        'LDALLO',
      ];

      const validSymbols = filterValidSymbols(symbols);

      // Only SUI and POL should be valid
      expect(validSymbols).toEqual(['SUI', 'POL']);
    });
  });

  describe('getSymbolFilterReason', () => {
    it('should return correct reason for empty symbol', () => {
      expect(getSymbolFilterReason('')).toBe('Empty or invalid symbol');
      expect(getSymbolFilterReason('   ')).toBe('Empty or invalid symbol');
    });

    it('should return correct reason for stablecoins', () => {
      expect(getSymbolFilterReason('USDT')).toBe('Stablecoin used as quote currency');
      expect(getSymbolFilterReason('USDC')).toBe('Stablecoin used as quote currency');
      expect(getSymbolFilterReason('BUSD')).toBe('Stablecoin used as quote currency');
    });

    it('should return correct reason for LD-prefixed tokens', () => {
      expect(getSymbolFilterReason('LDBNB')).toContain('LD prefix');
      expect(getSymbolFilterReason('LDETH')).toContain('LD prefix');
    });

    it('should return correct reason for RW-prefixed tokens', () => {
      expect(getSymbolFilterReason('RWUSDT')).toContain('RW prefix');
    });

    it('should return correct reason for BS-prefixed tokens', () => {
      expect(getSymbolFilterReason('BSBTC')).toContain('BS prefix');
    });

    it('should return correct reason for BN-prefixed tokens', () => {
      expect(getSymbolFilterReason('BNBTC')).toContain('BN prefix');
    });

    it('should return "Valid symbol" for valid symbols', () => {
      expect(getSymbolFilterReason('BTC')).toBe('Valid symbol');
      expect(getSymbolFilterReason('ETH')).toBe('Valid symbol');
      expect(getSymbolFilterReason('SOL')).toBe('Valid symbol');
    });

    it('should handle case insensitivity', () => {
      expect(getSymbolFilterReason('ldbnb')).toContain('LD prefix');
      expect(getSymbolFilterReason('usdt')).toBe('Stablecoin used as quote currency');
      expect(getSymbolFilterReason('btc')).toBe('Valid symbol');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete sync flow with mixed symbols', () => {
      // Simulate balances from Binance API
      const balances = [
        { asset: 'BTC', free: '1.5', locked: '0' },
        { asset: 'LDBNB', free: '100', locked: '0' },
        { asset: 'ETH', free: '10', locked: '0' },
        { asset: 'USDT', free: '5000', locked: '0' },
        { asset: 'SOL', free: '50', locked: '0' },
        { asset: 'LDETH', free: '20', locked: '0' },
      ];

      const symbols = balances.map(b => b.asset);
      const validSymbols = filterValidSymbols(symbols);

      // Should only include BTC, ETH, SOL
      expect(validSymbols).toEqual(['BTC', 'ETH', 'SOL']);
      expect(validSymbols.length).toBe(3);

      // Verify reasons for filtered symbols
      const invalidSymbols = symbols.filter(s => !validSymbols.includes(s));
      expect(invalidSymbols).toContain('LDBNB');
      expect(invalidSymbols).toContain('USDT');
      expect(invalidSymbols).toContain('LDETH');
    });
  });
});
