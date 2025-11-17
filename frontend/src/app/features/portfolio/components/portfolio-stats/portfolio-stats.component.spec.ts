// T118: Portfolio Statistics Component Tests

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioStatsComponent } from './portfolio-stats.component';
import { PortfolioStatistics } from '../../../../shared/models/portfolio.model';
import { ComponentRef } from '@angular/core';

describe('PortfolioStatsComponent', () => {
  let component: PortfolioStatsComponent;
  let fixture: ComponentFixture<PortfolioStatsComponent>;
  let componentRef: ComponentRef<PortfolioStatsComponent>;

  const mockStatistics: PortfolioStatistics = {
    totalValue: 175000,
    totalCostBasis: 150000,
    totalGainLoss: 25000,
    totalGainLossPercentage: 16.67,
    bestPerformer: {
      symbol: 'BTC',
      gainLossPercentage: 25.5,
    },
    worstPerformer: {
      symbol: 'ADA',
      gainLossPercentage: -10.2,
    },
    largestHolding: {
      symbol: 'ETH',
      percentage: 45.5,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioStatsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioStatsComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Statistics Rendering', () => {
    it('should display all statistics cards when data is provided', () => {
      componentRef.setInput('statistics', mockStatistics);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll('.bg-white.rounded-lg.shadow');

      // Should have 5 cards: best performer, worst performer, largest holding, total gain/loss, total value
      expect(cards.length).toBe(5);
    });

    it('should display best performer with correct symbol and percentage', () => {
      componentRef.setInput('statistics', mockStatistics);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const bestPerformerCard = compiled.querySelector('.portfolio-stats > div:first-child');

      expect(bestPerformerCard?.textContent).toContain('Best Performer');
      expect(bestPerformerCard?.textContent).toContain('BTC');
      expect(bestPerformerCard?.textContent).toContain('+25.50%');
    });

    it('should display best performer with green color', () => {
      componentRef.setInput('statistics', mockStatistics);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const greenIcon = compiled.querySelector('.bg-green-100');

      expect(greenIcon).toBeTruthy();
    });

    it('should display worst performer with correct symbol and percentage', () => {
      componentRef.setInput('statistics', mockStatistics);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cards = Array.from(compiled.querySelectorAll('.portfolio-stats > div'));
      const worstPerformerCard = cards.find((card) =>
        card.textContent?.includes('Worst Performer')
      );

      expect(worstPerformerCard?.textContent).toContain('ADA');
      expect(worstPerformerCard?.textContent).toContain('-10.20%');
    });

    it('should display worst performer with red color', () => {
      componentRef.setInput('statistics', mockStatistics);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const redIcon = compiled.querySelector('.bg-red-100');

      expect(redIcon).toBeTruthy();
    });

    it('should display largest holding with correct symbol and percentage', () => {
      componentRef.setInput('statistics', mockStatistics);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cards = Array.from(compiled.querySelectorAll('.portfolio-stats > div'));
      const largestHoldingCard = cards.find((card) =>
        card.textContent?.includes('Largest Holding')
      );

      expect(largestHoldingCard?.textContent).toContain('ETH');
      expect(largestHoldingCard?.textContent).toContain('+45.50%');
      expect(largestHoldingCard?.textContent).toContain('of portfolio');
    });

    it('should display largest holding with blue color', () => {
      componentRef.setInput('statistics', mockStatistics);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const blueIcon = compiled.querySelector('.bg-blue-100');

      expect(blueIcon).toBeTruthy();
    });

    it('should display total gain/loss with badge component', () => {
      componentRef.setInput('statistics', mockStatistics);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cards = Array.from(compiled.querySelectorAll('.portfolio-stats > div'));
      const gainLossCard = cards.find((card) =>
        card.textContent?.includes('Total Gain/Loss')
      );
      const badge = gainLossCard?.querySelector('app-gain-loss-badge');

      expect(badge).toBeTruthy();
    });

    it('should display total value and cost basis', () => {
      componentRef.setInput('statistics', mockStatistics);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cards = Array.from(compiled.querySelectorAll('.portfolio-stats > div'));
      const totalValueCard = cards.find((card) => card.textContent?.includes('Total Value'));

      expect(totalValueCard?.textContent).toContain('$175,000.00');
      expect(totalValueCard?.textContent).toContain('Cost basis:');
      expect(totalValueCard?.textContent).toContain('$150,000.00');
    });
  });

  describe('Null Statistics Handling', () => {
    it('should display "No statistics available" when statistics is null', () => {
      componentRef.setInput('statistics', null);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('No statistics available');
    });

    it('should not display cards when statistics is null', () => {
      componentRef.setInput('statistics', null);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll('.portfolio-stats');

      expect(cards.length).toBe(0);
    });

    it('should handle statistics with null performers gracefully', () => {
      const partialStats: PortfolioStatistics = {
        totalValue: 100000,
        totalCostBasis: 90000,
        totalGainLoss: 10000,
        totalGainLossPercentage: 11.11,
        bestPerformer: null,
        worstPerformer: null,
        largestHolding: null,
      };

      componentRef.setInput('statistics', partialStats);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll('.bg-white.rounded-lg.shadow');

      // Should only have 2 cards: total gain/loss and total value (no performers/largest holding)
      expect(cards.length).toBe(2);
      expect(compiled.textContent).not.toContain('Best Performer');
      expect(compiled.textContent).not.toContain('Worst Performer');
      expect(compiled.textContent).not.toContain('Largest Holding');
    });
  });

  describe('Formatting Methods', () => {
    it('should format currency correctly', () => {
      const result = component.formatCurrency(175000);
      expect(result).toBe('$175,000.00');
    });

    it('should format small currency values correctly', () => {
      const result = component.formatCurrency(0.01);
      expect(result).toBe('$0.01');
    });

    it('should format large currency values correctly', () => {
      const result = component.formatCurrency(1234567.89);
      expect(result).toBe('$1,234,567.89');
    });

    it('should format negative currency values correctly', () => {
      const result = component.formatCurrency(-5000);
      expect(result).toBe('-$5,000.00');
    });

    it('should format positive percentage with plus sign', () => {
      const result = component.formatPercentage(25.5);
      expect(result).toBe('+25.50%');
    });

    it('should format negative percentage with minus sign', () => {
      const result = component.formatPercentage(-10.2);
      expect(result).toBe('-10.20%');
    });

    it('should format zero percentage with plus sign', () => {
      const result = component.formatPercentage(0);
      expect(result).toBe('+0.00%');
    });

    it('should format percentage with correct decimal places', () => {
      const result = component.formatPercentage(16.6666);
      expect(result).toBe('+16.67%');
    });
  });

  describe('Responsive Grid Layout', () => {
    it('should apply responsive grid classes', () => {
      componentRef.setInput('statistics', mockStatistics);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const grid = compiled.querySelector('.grid');

      expect(grid?.classList.contains('grid-cols-1')).toBe(true);
      expect(grid?.classList.contains('md:grid-cols-2')).toBe(true);
      expect(grid?.classList.contains('lg:grid-cols-3')).toBe(true);
    });
  });

  describe('Visual Indicators', () => {
    it('should render SVG icons for each statistic', () => {
      componentRef.setInput('statistics', mockStatistics);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const svgIcons = compiled.querySelectorAll('svg');

      // Should have at least 3 SVG icons (best, worst, largest)
      expect(svgIcons.length).toBeGreaterThanOrEqual(3);
    });

    it('should display different colored backgrounds for different stats', () => {
      componentRef.setInput('statistics', mockStatistics);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('.bg-green-100')).toBeTruthy(); // Best performer
      expect(compiled.querySelector('.bg-red-100')).toBeTruthy(); // Worst performer
      expect(compiled.querySelector('.bg-blue-100')).toBeTruthy(); // Largest holding
    });
  });

  describe('Accessibility', () => {
    it('should have uppercase labels for better readability', () => {
      componentRef.setInput('statistics', mockStatistics);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const labels = compiled.querySelectorAll('.uppercase.tracking-wide');

      expect(labels.length).toBeGreaterThan(0);
    });

    it('should use semantic text sizes for hierarchy', () => {
      componentRef.setInput('statistics', mockStatistics);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('.text-2xl')).toBeTruthy(); // Main values
      expect(compiled.querySelector('.text-sm')).toBeTruthy(); // Labels
    });
  });
});
