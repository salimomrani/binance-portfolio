// T090: Portfolio summary component test (partial)

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioSummaryComponent } from './portfolio-summary.component';
import { Portfolio } from '../../../../shared/models/portfolio.model';

describe('PortfolioSummaryComponent', () => {
  let component: PortfolioSummaryComponent;
  let fixture: ComponentFixture<PortfolioSummaryComponent>;

  const mockPortfolio: Portfolio = {
    id: '1',
    name: 'Test Portfolio',
    description: 'Test',
    isDefault: true,
    totalValue: 50000,
    totalGainLoss: 5000,
    totalGainLossPercentage: 10,
    holdingsCount: 3,
    lastUpdated: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioSummaryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display portfolio summary', () => {
    // Signal-based input update
    fixture.componentRef.setInput('portfolio', mockPortfolio);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('$50,000.00');
    expect(compiled.textContent).toContain('3 holdings');
  });

  it('should show no portfolio message when null', () => {
    // Signal-based input update
    fixture.componentRef.setInput('portfolio', null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No portfolio selected');
  });

  it('should apply correct gain/loss class', () => {
    fixture.componentRef.setInput('portfolio', mockPortfolio);
    expect(component.getGainLossClass()).toBe('text-profit');

    fixture.componentRef.setInput('portfolio', { ...mockPortfolio, totalGainLoss: -1000 });
    expect(component.getGainLossClass()).toBe('text-loss');

    fixture.componentRef.setInput('portfolio', { ...mockPortfolio, totalGainLoss: 0 });
    expect(component.getGainLossClass()).toBe('text-gray-600');
  });

  it('should format currency correctly', () => {
    const formatted = component.formatCurrency(12345.67);
    expect(formatted).toBe('$12,345.67');
  });

  it('should format percentage correctly', () => {
    const formatted = component.formatPercentage(10);
    expect(formatted).toContain('10.00');
  });

  it('should display relative time', () => {
    const pastDate = new Date(Date.now() - 30000); // 30 seconds ago
    fixture.componentRef.setInput('lastUpdated', pastDate);
    const relativeTime = component.getRelativeTime();
    expect(relativeTime).toContain('seconds ago');
  });
});
