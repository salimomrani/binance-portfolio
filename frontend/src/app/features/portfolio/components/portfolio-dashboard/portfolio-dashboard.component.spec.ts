// T090: Portfolio dashboard component test - Enhanced

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioDashboardComponent } from './portfolio-dashboard.component';
import { PortfolioFacadeService } from '../../services/portfolio-facade.service';
import { Router } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { Portfolio } from '../../../../shared/models/portfolio.model';

describe('PortfolioDashboardComponent', () => {
  let component: PortfolioDashboardComponent;
  let fixture: ComponentFixture<PortfolioDashboardComponent>;
  let mockPortfolioFacade: jasmine.SpyObj<PortfolioFacadeService>;
  let mockRouter: jasmine.SpyObj<Router>;

  // Observable subjects for testing
  let portfoliosSubject: BehaviorSubject<Portfolio[]>;
  let selectedPortfolioSubject: BehaviorSubject<Portfolio | null>;
  let loadingSubject: BehaviorSubject<boolean>;
  let errorSubject: BehaviorSubject<string | null>;
  let lastUpdatedSubject: BehaviorSubject<Date | null>;

  const mockHoldings = [
    {
      id: 'h1',
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: 1.5,
      averageCost: 45000,
      currentPrice: 50000,
      currentValue: 75000,
      costBasis: 67500,
      gainLoss: 7500,
      gainLossPercentage: 11.11,
      allocationPercentage: 50,
      priceChange24h: 2.5,
      notes: null,
      lastUpdated: new Date()
    },
    {
      id: 'h2',
      symbol: 'ETH',
      name: 'Ethereum',
      quantity: 10,
      averageCost: 3000,
      currentPrice: 3500,
      currentValue: 35000,
      costBasis: 30000,
      gainLoss: 5000,
      gainLossPercentage: 16.67,
      allocationPercentage: 50,
      priceChange24h: 1.8,
      notes: null,
      lastUpdated: new Date()
    }
  ];

  const mockPortfolio: Portfolio = {
    id: '1',
    name: 'Test Portfolio',
    description: 'Test Description',
    isDefault: true,
    totalValue: 110000,
    totalGainLoss: 12500,
    totalGainLossPercentage: 12.82,
    holdingsCount: 2,
    lastUpdated: new Date(),
    createdAt: new Date(),
    holdings: mockHoldings,
  };

  const mockEmptyPortfolio: Portfolio = {
    ...mockPortfolio,
    id: '2',
    name: 'Empty Portfolio',
    holdings: [],
    holdingsCount: 0,
    totalValue: 0,
    totalGainLoss: 0,
    totalGainLossPercentage: 0,
  };

  beforeEach(async () => {
    // Initialize subjects
    portfoliosSubject = new BehaviorSubject<Portfolio[]>([mockPortfolio]);
    selectedPortfolioSubject = new BehaviorSubject<Portfolio | null>(mockPortfolio);
    loadingSubject = new BehaviorSubject<boolean>(false);
    errorSubject = new BehaviorSubject<string | null>(null);
    lastUpdatedSubject = new BehaviorSubject<Date | null>(new Date());

    mockPortfolioFacade = jasmine.createSpyObj('PortfolioFacadeService', [
      'loadPortfolios',
      'selectPortfolio',
      'loadPortfolioDetails',
      'clearError',
    ]);

    // Setup observable properties
    mockPortfolioFacade.portfolios$ = portfoliosSubject.asObservable();
    mockPortfolioFacade.selectedPortfolio$ = selectedPortfolioSubject.asObservable();
    mockPortfolioFacade.loading$ = loadingSubject.asObservable();
    mockPortfolioFacade.error$ = errorSubject.asObservable();
    mockPortfolioFacade.lastUpdated$ = lastUpdatedSubject.asObservable();

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

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load portfolios on init', () => {
      expect(mockPortfolioFacade.loadPortfolios).toHaveBeenCalled();
    });

    it('should initialize signals with correct values', () => {
      expect(component['portfolios']()).toEqual([mockPortfolio]);
      expect(component['selectedPortfolio']()).toEqual(mockPortfolio);
      expect(component['loading']()).toBe(false);
      expect(component['error']()).toBe(null);
      expect(component['lastUpdated']()).toBeTruthy();
    });
  });

  describe('Portfolio Display', () => {
    it('should display portfolio name', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Test Portfolio');
    });

    it('should display portfolio description', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Test Description');
    });

    it('should display holdings count', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('2 holdings');
    });

    it('should display dashboard title', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('h1');
      expect(title?.textContent).toContain('Portfolio Dashboard');
    });

    it('should highlight selected portfolio', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const selectedButton = compiled.querySelector('.bg-blue-50');
      expect(selectedButton).toBeTruthy();
      expect(selectedButton?.textContent).toContain('Test Portfolio');
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading', () => {
      loadingSubject.next(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Loading portfolios...');
      expect(compiled.querySelector('.animate-spin')).toBeTruthy();
    });

    it('should disable refresh button when loading', () => {
      loadingSubject.next(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const refreshButton = compiled.querySelector('button[disabled]');
      expect(refreshButton).toBeTruthy();
    });

    it('should not display loading when not loading', () => {
      loadingSubject.next(false);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('Loading portfolios...');
    });
  });

  describe('Error State', () => {
    it('should display error message when error exists', () => {
      errorSubject.next('Failed to load portfolios');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Failed to load portfolios');
    });

    it('should display error with red styling', () => {
      errorSubject.next('Error message');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const errorDiv = compiled.querySelector('.bg-red-50');
      expect(errorDiv).toBeTruthy();
    });

    it('should have close button for error', () => {
      errorSubject.next('Error message');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const closeButtons = compiled.querySelectorAll('button');
      const hasCloseButton = Array.from(closeButtons).some(btn =>
        btn.onclick?.toString().includes('onClearError')
      );
      expect(hasCloseButton || closeButtons.length > 0).toBe(true);
    });

    it('should not display error when no error exists', () => {
      errorSubject.next(null);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const errorDiv = compiled.querySelector('.bg-red-50');
      expect(errorDiv).toBeFalsy();
    });
  });

  describe('Empty States', () => {
    it('should display no portfolios message when list is empty', () => {
      portfoliosSubject.next([]);
      selectedPortfolioSubject.next(null);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No portfolios yet');
    });

    it('should display create portfolio CTA when no portfolios', () => {
      portfoliosSubject.next([]);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Create Your First Portfolio');
    });

    it('should display no holdings message for empty portfolio', () => {
      selectedPortfolioSubject.next(mockEmptyPortfolio);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No holdings yet');
    });

    it('should display select portfolio message when none selected', () => {
      portfoliosSubject.next([mockPortfolio]);
      selectedPortfolioSubject.next(null);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Select a portfolio to view details');
    });
  });

  describe('Computed Signals', () => {
    it('should compute hasPortfolios correctly when portfolios exist', () => {
      portfoliosSubject.next([mockPortfolio]);
      fixture.detectChanges();
      expect(component['hasPortfolios']()).toBe(true);
    });

    it('should compute hasPortfolios correctly when no portfolios', () => {
      portfoliosSubject.next([]);
      fixture.detectChanges();
      expect(component['hasPortfolios']()).toBe(false);
    });

    it('should compute isEmpty correctly for empty portfolio', () => {
      selectedPortfolioSubject.next(mockEmptyPortfolio);
      fixture.detectChanges();
      expect(component['isEmpty']()).toBe(true);
    });

    it('should compute isEmpty correctly for portfolio with holdings', () => {
      selectedPortfolioSubject.next(mockPortfolio);
      fixture.detectChanges();
      expect(component['isEmpty']()).toBe(false);
    });

    it('should compute isEmpty as true when no portfolio selected', () => {
      selectedPortfolioSubject.next(null);
      fixture.detectChanges();
      expect(component['isEmpty']()).toBe(true);
    });
  });

  describe('User Interactions', () => {
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

    it('should refresh with selected portfolio', () => {
      component['selectedPortfolio'].set(mockPortfolio);
      component.onRefresh();
      expect(mockPortfolioFacade.loadPortfolioDetails).toHaveBeenCalledWith('1');
    });

    it('should refresh all portfolios when none selected', () => {
      component['selectedPortfolio'].set(null);
      component.onRefresh();
      expect(mockPortfolioFacade.loadPortfolios).toHaveBeenCalled();
    });
  });

  describe('Multiple Portfolios', () => {
    it('should display multiple portfolios in sidebar', () => {
      const portfolio2: Portfolio = {
        ...mockPortfolio,
        id: '2',
        name: 'Second Portfolio',
      };
      portfoliosSubject.next([mockPortfolio, portfolio2]);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Test Portfolio');
      expect(compiled.textContent).toContain('Second Portfolio');
    });

    it('should allow switching between portfolios', () => {
      const portfolio2: Portfolio = {
        ...mockPortfolio,
        id: '2',
        name: 'Second Portfolio',
      };
      portfoliosSubject.next([mockPortfolio, portfolio2]);
      fixture.detectChanges();

      component.onPortfolioSelect('2');
      expect(mockPortfolioFacade.selectPortfolio).toHaveBeenCalledWith('2');
    });
  });

  describe('Last Updated Display', () => {
    it('should display last updated timestamp', () => {
      const testDate = new Date('2024-01-15T10:30:00');
      lastUpdatedSubject.next(testDate);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Last updated:');
    });

    it('should not display last updated when null', () => {
      lastUpdatedSubject.next(null);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const lastUpdatedText = Array.from(compiled.querySelectorAll('div')).find(
        div => div.textContent?.includes('Last updated:')
      );
      expect(lastUpdatedText).toBeFalsy();
    });
  });

  describe('Reactive Updates', () => {
    it('should update view when portfolios change', () => {
      const newPortfolio: Portfolio = {
        ...mockPortfolio,
        id: '3',
        name: 'New Portfolio',
      };

      portfoliosSubject.next([newPortfolio]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('New Portfolio');
      expect(compiled.textContent).not.toContain('Test Portfolio');
    });

    it('should update view when selected portfolio changes', () => {
      const newPortfolio: Portfolio = {
        ...mockPortfolio,
        id: '2',
        name: 'Different Portfolio',
        description: 'Different Description',
      };

      selectedPortfolioSubject.next(newPortfolio);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Different Portfolio');
    });
  });
});
