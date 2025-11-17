// T091: Portfolio table component test - Enhanced

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioTableComponent } from './portfolio-table.component';
import { Holding } from '../../../../shared/models/portfolio.model';

describe('PortfolioTableComponent', () => {
  let component: PortfolioTableComponent;
  let fixture: ComponentFixture<PortfolioTableComponent>;

  const mockHoldings: Holding[] = [
    {
      id: '1',
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: 1.5,
      averageCost: 30000,
      currentPrice: 35000,
      currentValue: 52500,
      costBasis: 45000,
      gainLoss: 7500,
      gainLossPercentage: 16.67,
      allocationPercentage: 60,
      priceChange24h: 2.5,
      notes: null,
      lastUpdated: new Date(),
    },
    {
      id: '2',
      symbol: 'ETH',
      name: 'Ethereum',
      quantity: 10,
      averageCost: 2000,
      currentPrice: 1800,
      currentValue: 18000,
      costBasis: 20000,
      gainLoss: -2000,
      gainLossPercentage: -10,
      allocationPercentage: 40,
      priceChange24h: -3.2,
      notes: null,
      lastUpdated: new Date(),
    },
    {
      id: '3',
      symbol: 'ADA',
      name: 'Cardano',
      quantity: 1000,
      averageCost: 0.5,
      currentPrice: 0.55,
      currentValue: 550,
      costBasis: 500,
      gainLoss: 50,
      gainLossPercentage: 10,
      allocationPercentage: 10,
      priceChange24h: 1.5,
      notes: 'Long term hold',
      lastUpdated: new Date(),
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioTableComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty holdings', () => {
      expect(component.holdings()).toEqual([]);
    });

    it('should have default sort column as currentValue', () => {
      expect(component['sortColumn']()).toBe('currentValue');
    });

    it('should have default sort order as desc', () => {
      expect(component['sortOrder']()).toBe('desc');
    });
  });

  describe('Table Rendering', () => {
    it('should display holdings in table', () => {
      fixture.componentRef.setInput('holdings', mockHoldings);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('BTC');
      expect(compiled.textContent).toContain('ETH');
      expect(compiled.textContent).toContain('ADA');
    });

    it('should display holding names', () => {
      fixture.componentRef.setInput('holdings', mockHoldings);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Bitcoin');
      expect(compiled.textContent).toContain('Ethereum');
      expect(compiled.textContent).toContain('Cardano');
    });

    it('should display all table rows for holdings', () => {
      fixture.componentRef.setInput('holdings', mockHoldings);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const rows = compiled.querySelectorAll('tbody tr');
      expect(rows.length).toBe(3);
    });

    it('should show empty state when no holdings', () => {
      fixture.componentRef.setInput('holdings', []);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No holdings to display');
    });

    it('should render table headers', () => {
      fixture.componentRef.setInput('holdings', mockHoldings);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Symbol');
      expect(compiled.textContent).toContain('Quantity');
      expect(compiled.textContent).toContain('Current Value');
    });
  });

  describe('Sorting Functionality', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('holdings', mockHoldings);
      fixture.detectChanges();
    });

    it('should sort by symbol ascending', () => {
      component.onSort('symbol');
      component.onSort('symbol'); // Toggle to asc
      fixture.detectChanges();

      const sortedHoldings = component['sortedHoldings']();
      expect(sortedHoldings[0].symbol).toBe('ADA');
      expect(sortedHoldings[1].symbol).toBe('BTC');
      expect(sortedHoldings[2].symbol).toBe('ETH');
    });

    it('should sort by symbol descending', () => {
      component.onSort('symbol');
      fixture.detectChanges();

      const sortedHoldings = component['sortedHoldings']();
      expect(sortedHoldings[0].symbol).toBe('ETH');
      expect(sortedHoldings[1].symbol).toBe('BTC');
      expect(sortedHoldings[2].symbol).toBe('ADA');
    });

    it('should sort by quantity ascending', () => {
      component.onSort('quantity');
      component.onSort('quantity'); // Toggle to asc
      fixture.detectChanges();

      const sortedHoldings = component['sortedHoldings']();
      expect(sortedHoldings[0].symbol).toBe('BTC'); // 1.5
      expect(sortedHoldings[1].symbol).toBe('ETH'); // 10
      expect(sortedHoldings[2].symbol).toBe('ADA'); // 1000
    });

    it('should sort by current value descending', () => {
      component.onSort('currentValue');
      fixture.detectChanges();

      const sortedHoldings = component['sortedHoldings']();
      expect(sortedHoldings[0].symbol).toBe('BTC'); // 52500
      expect(sortedHoldings[1].symbol).toBe('ETH'); // 18000
      expect(sortedHoldings[2].symbol).toBe('ADA'); // 550
    });

    it('should sort by gain/loss ascending', () => {
      component.onSort('gainLoss');
      component.onSort('gainLoss'); // Toggle to asc
      fixture.detectChanges();

      const sortedHoldings = component['sortedHoldings']();
      expect(sortedHoldings[0].symbol).toBe('ETH'); // -2000
      expect(sortedHoldings[1].symbol).toBe('ADA'); // 50
      expect(sortedHoldings[2].symbol).toBe('BTC'); // 7500
    });

    it('should sort by gain/loss percentage descending', () => {
      component.onSort('gainLossPercentage');
      fixture.detectChanges();

      const sortedHoldings = component['sortedHoldings']();
      expect(sortedHoldings[0].symbol).toBe('BTC'); // 16.67%
      expect(sortedHoldings[1].symbol).toBe('ADA'); // 10%
      expect(sortedHoldings[2].symbol).toBe('ETH'); // -10%
    });

    it('should toggle sort order on same column', () => {
      component.onSort('symbol');
      expect(component['sortOrder']()).toBe('desc');

      component.onSort('symbol');
      expect(component['sortOrder']()).toBe('asc');
    });

    it('should reset to desc when changing columns', () => {
      component.onSort('symbol');
      component.onSort('symbol'); // Now asc

      component.onSort('quantity');
      expect(component['sortOrder']()).toBe('desc');
    });

    it('should track sorted column', () => {
      component.onSort('symbol');
      expect(component.isSorted('symbol')).toBe(true);
      expect(component.isSorted('quantity')).toBe(false);
    });
  });

  describe('Sort Icons', () => {
    it('should return sort icon for unsorted column', () => {
      component.onSort('symbol');
      expect(component.getSortIcon('quantity')).toBe('sort');
    });

    it('should return sort-desc icon for descending sort', () => {
      component.onSort('symbol');
      expect(component.getSortIcon('symbol')).toBe('sort-desc');
    });

    it('should return sort-asc icon for ascending sort', () => {
      component.onSort('symbol');
      component.onSort('symbol'); // Toggle to asc
      expect(component.getSortIcon('symbol')).toBe('sort-asc');
    });
  });

  describe('Computed Signals', () => {
    it('should compute isEmpty as true for empty array', () => {
      fixture.componentRef.setInput('holdings', []);
      fixture.detectChanges();
      expect(component['isEmpty']()).toBe(true);
    });

    it('should compute isEmpty as false when holdings exist', () => {
      fixture.componentRef.setInput('holdings', mockHoldings);
      fixture.detectChanges();
      expect(component['isEmpty']()).toBe(false);
    });

    it('should recompute sortedHoldings when holdings change', () => {
      fixture.componentRef.setInput('holdings', [mockHoldings[0]]);
      fixture.detectChanges();
      let sorted = component['sortedHoldings']();
      expect(sorted.length).toBe(1);

      fixture.componentRef.setInput('holdings', mockHoldings);
      fixture.detectChanges();
      sorted = component['sortedHoldings']();
      expect(sorted.length).toBe(3);
    });

    it('should recompute sortedHoldings when sort changes', () => {
      fixture.componentRef.setInput('holdings', mockHoldings);
      fixture.detectChanges();

      component.onSort('symbol');
      const sortedBySymbol = component['sortedHoldings']();

      component.onSort('currentValue');
      const sortedByValue = component['sortedHoldings']();

      expect(sortedBySymbol[0].symbol).not.toBe(sortedByValue[0].symbol);
    });
  });

  describe('Formatting Functions', () => {
    describe('Currency Formatting', () => {
      it('should format currency correctly', () => {
        const formatted = component.formatCurrency(1234.56);
        expect(formatted).toBe('$1,234.56');
      });

      it('should format large numbers with commas', () => {
        const formatted = component.formatCurrency(1234567.89);
        expect(formatted).toBe('$1,234,567.89');
      });

      it('should format zero correctly', () => {
        const formatted = component.formatCurrency(0);
        expect(formatted).toBe('$0.00');
      });

      it('should format negative currency', () => {
        const formatted = component.formatCurrency(-1234.56);
        expect(formatted).toBe('-$1,234.56');
      });

      it('should format small decimals', () => {
        const formatted = component.formatCurrency(0.01);
        expect(formatted).toBe('$0.01');
      });
    });

    describe('Percentage Formatting', () => {
      it('should format percentage correctly', () => {
        const formatted = component.formatPercentage(15.5);
        expect(formatted).toContain('15.50');
        expect(formatted).toContain('%');
      });

      it('should include plus sign for positive percentages', () => {
        const formatted = component.formatPercentage(10);
        expect(formatted).toContain('+');
      });

      it('should include minus sign for negative percentages', () => {
        const formatted = component.formatPercentage(-10);
        expect(formatted).toContain('-');
      });

      it('should format zero percentage', () => {
        const formatted = component.formatPercentage(0);
        expect(formatted).toContain('0.00');
      });

      it('should handle large percentages', () => {
        const formatted = component.formatPercentage(250.5);
        expect(formatted).toContain('250.50');
      });
    });

    describe('Quantity Formatting', () => {
      it('should format whole numbers', () => {
        const formatted = component.formatQuantity(100);
        expect(formatted).toBe('100.00');
      });

      it('should format decimals up to 8 places', () => {
        const formatted = component.formatQuantity(0.00012345);
        expect(formatted).toBe('0.00012345');
      });

      it('should format large quantities with commas', () => {
        const formatted = component.formatQuantity(1234567.89);
        expect(formatted).toContain('1,234,567');
      });

      it('should preserve decimal precision', () => {
        const formatted = component.formatQuantity(1.12345678);
        expect(formatted).toBe('1.12345678');
      });
    });
  });

  describe('Gain/Loss Styling', () => {
    it('should apply profit class for positive gain', () => {
      expect(component.getGainLossClass(100)).toBe('text-profit');
      expect(component.getGainLossClass(0.01)).toBe('text-profit');
    });

    it('should apply loss class for negative gain', () => {
      expect(component.getGainLossClass(-100)).toBe('text-loss');
      expect(component.getGainLossClass(-0.01)).toBe('text-loss');
    });

    it('should apply neutral class for zero gain', () => {
      expect(component.getGainLossClass(0)).toBe('text-gray-600');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single holding', () => {
      fixture.componentRef.setInput('holdings', [mockHoldings[0]]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('BTC');
      expect(component['sortedHoldings']().length).toBe(1);
    });

    it('should handle very large quantities', () => {
      const largeHolding: Holding = {
        ...mockHoldings[0],
        quantity: 999999999,
      };
      fixture.componentRef.setInput('holdings', [largeHolding]);
      fixture.detectChanges();

      const formatted = component.formatQuantity(largeHolding.quantity);
      expect(formatted).toContain('999,999,999');
    });

    it('should handle very small quantities', () => {
      const formatted = component.formatQuantity(0.00000001);
      expect(formatted).toBe('0.00000001');
    });

    it('should handle holdings with identical values', () => {
      const duplicateHoldings = [mockHoldings[0], { ...mockHoldings[0], id: '4' }];
      fixture.componentRef.setInput('holdings', duplicateHoldings);
      fixture.detectChanges();

      const sorted = component['sortedHoldings']();
      expect(sorted.length).toBe(2);
    });

    it('should maintain original array immutability', () => {
      const originalHoldings = [...mockHoldings];
      fixture.componentRef.setInput('holdings', mockHoldings);
      fixture.detectChanges();

      component.onSort('symbol');
      component['sortedHoldings']();

      expect(mockHoldings).toEqual(originalHoldings);
    });
  });

  describe('OnPush Change Detection', () => {
    it('should update view when holdings input changes', () => {
      fixture.componentRef.setInput('holdings', [mockHoldings[0]]);
      fixture.detectChanges();

      let compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('BTC');
      expect(compiled.textContent).not.toContain('ETH');

      fixture.componentRef.setInput('holdings', mockHoldings);
      fixture.detectChanges();

      compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('BTC');
      expect(compiled.textContent).toContain('ETH');
    });

    it('should update view when sort changes', () => {
      fixture.componentRef.setInput('holdings', mockHoldings);
      component.onSort('symbol');
      fixture.detectChanges();

      const firstSort = component['sortedHoldings']()[0].symbol;

      component.onSort('currentValue');
      fixture.detectChanges();

      const secondSort = component['sortedHoldings']()[0].symbol;
      expect(firstSort).not.toBe(secondSort);
    });
  });

  describe('Case Insensitive Symbol Sorting', () => {
    it('should sort symbols case-insensitively', () => {
      const mixedCaseHoldings: Holding[] = [
        { ...mockHoldings[0], symbol: 'btc' },
        { ...mockHoldings[1], symbol: 'ETH' },
        { ...mockHoldings[2], symbol: 'Ada' },
      ];

      fixture.componentRef.setInput('holdings', mixedCaseHoldings);
      component.onSort('symbol');
      component.onSort('symbol'); // Toggle to asc
      fixture.detectChanges();

      const sorted = component['sortedHoldings']();
      expect(sorted[0].symbol.toLowerCase()).toBe('ada');
      expect(sorted[1].symbol.toLowerCase()).toBe('btc');
      expect(sorted[2].symbol.toLowerCase()).toBe('eth');
    });
  });
});
