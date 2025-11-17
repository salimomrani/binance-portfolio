// T091: Portfolio table component test

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
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display holdings in table', () => {
    // Signal-based input update
    fixture.componentRef.setInput('holdings', mockHoldings);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('BTC');
    expect(compiled.textContent).toContain('ETH');
  });

  it('should show empty state when no holdings', () => {
    // Signal-based input update
    fixture.componentRef.setInput('holdings', []);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No holdings to display');
  });

  it('should sort by column', () => {
    fixture.componentRef.setInput('holdings', mockHoldings);
    component.onSort('symbol');
    fixture.detectChanges();

    expect(component.isSorted('symbol')).toBeTruthy();
  });

  it('should toggle sort order on same column', () => {
    fixture.componentRef.setInput('holdings', mockHoldings);
    component.onSort('symbol');
    component.onSort('symbol');

    expect(component['sortOrder']()).toBe('asc');
  });

  it('should format currency correctly', () => {
    const formatted = component.formatCurrency(1234.56);
    expect(formatted).toBe('$1,234.56');
  });

  it('should format percentage correctly', () => {
    const formatted = component.formatPercentage(15.5);
    expect(formatted).toContain('15.50');
  });

  it('should apply correct gain/loss class', () => {
    expect(component.getGainLossClass(100)).toBe('text-profit');
    expect(component.getGainLossClass(-100)).toBe('text-loss');
    expect(component.getGainLossClass(0)).toBe('text-gray-600');
  });

  it('should render sorted holdings', () => {
    fixture.componentRef.setInput('holdings', mockHoldings);
    component.onSort('currentValue');
    fixture.detectChanges();

    const sortedHoldings = component['sortedHoldings']();
    expect(sortedHoldings[0].symbol).toBe('BTC'); // Higher value
    expect(sortedHoldings[1].symbol).toBe('ETH'); // Lower value
  });
});
