// T090: Portfolio dashboard component test

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioDashboardComponent } from './portfolio-dashboard.component';
import { PortfolioFacadeService } from '../../services/portfolio-facade.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('PortfolioDashboardComponent', () => {
  let component: PortfolioDashboardComponent;
  let fixture: ComponentFixture<PortfolioDashboardComponent>;
  let mockPortfolioFacade: jasmine.SpyObj<PortfolioFacadeService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockPortfolio = {
    id: '1',
    name: 'Test Portfolio',
    description: 'Test Description',
    isDefault: true,
    totalValue: 10000,
    totalGainLoss: 1000,
    totalGainLossPercentage: 10,
    holdingsCount: 5,
    lastUpdated: new Date(),
    createdAt: new Date(),
    holdings: [],
  };

  beforeEach(async () => {
    mockPortfolioFacade = jasmine.createSpyObj('PortfolioFacadeService', [
      'loadPortfolios',
      'selectPortfolio',
      'loadPortfolioDetails',
      'clearError',
    ]);

    // Setup observable properties
    mockPortfolioFacade.portfolios$ = of([mockPortfolio]);
    mockPortfolioFacade.selectedPortfolio$ = of(mockPortfolio);
    mockPortfolioFacade.loading$ = of(false);
    mockPortfolioFacade.error$ = of(null);
    mockPortfolioFacade.lastUpdated$ = of(new Date());

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [PortfolioDashboardComponent],
      providers: [
        { provide: PortfolioFacadeService, useValue: mockPortfolioFacade },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load portfolios on init', () => {
    expect(mockPortfolioFacade.loadPortfolios).toHaveBeenCalled();
  });

  it('should display portfolio list', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Portfolio');
  });

  it('should handle portfolio selection', () => {
    component.onPortfolioSelect('1');
    expect(mockPortfolioFacade.selectPortfolio).toHaveBeenCalledWith('1');
  });

  it('should navigate to create portfolio', () => {
    component.onCreatePortfolio();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/portfolio/create']);
  });

  it('should clear error', () => {
    component.onClearError();
    expect(mockPortfolioFacade.clearError).toHaveBeenCalled();
  });

  it('should refresh portfolio data', () => {
    component.onRefresh();
    expect(mockPortfolioFacade.loadPortfolioDetails).toHaveBeenCalled();
  });
});
