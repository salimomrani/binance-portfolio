// T117: Holding detail component tests

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { HoldingDetailComponent } from './holding-detail.component';
import { Holding } from '../../../../shared/models/portfolio.model';
import { Transaction } from '../../../../shared/models/holding.model';
import * as HoldingsActions from '../../store/holdings.actions';
import * as HoldingsSelectors from '../../store/holdings.selectors';
import { of } from 'rxjs';

describe('HoldingDetailComponent', () => {
  let component: HoldingDetailComponent;
  let fixture: ComponentFixture<HoldingDetailComponent>;
  let store: MockStore;
  let router: Router;
  let activatedRoute: ActivatedRoute;

  const mockHolding: Holding = {
    id: 'holding-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    quantity: 2.5,
    averageCost: 30000,
    currentPrice: 35000,
    currentValue: 87500,
    costBasis: 75000,
    gainLoss: 12500,
    gainLossPercentage: 16.67,
    allocationPercentage: 50,
    priceChange24h: 2.5,
    notes: 'Test holding',
    lastUpdated: new Date('2024-01-15'),
  };

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'BUY',
      quantity: 1.5,
      pricePerUnit: 28000,
      totalCost: 42000,
      fee: 100,
      date: new Date('2024-01-10'),
      notes: 'First purchase',
      createdAt: new Date('2024-01-10'),
    },
    {
      id: 'tx-2',
      type: 'BUY',
      quantity: 1.0,
      pricePerUnit: 33000,
      totalCost: 33000,
      fee: 50,
      date: new Date('2024-01-12'),
      notes: null,
      createdAt: new Date('2024-01-12'),
    },
    {
      id: 'tx-3',
      type: 'SELL',
      quantity: 0.5,
      pricePerUnit: 35000,
      totalCost: 17500,
      fee: 25,
      date: new Date('2024-01-14'),
      notes: 'Partial sell',
      createdAt: new Date('2024-01-14'),
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoldingDetailComponent],
      providers: [
        provideMockStore({
          selectors: [
            { selector: HoldingsSelectors.selectSelectedHolding, value: null },
            { selector: HoldingsSelectors.selectTransactionsSortedByDate, value: [] },
            { selector: HoldingsSelectors.selectHoldingsLoading, value: false },
            { selector: HoldingsSelectors.selectHoldingsError, value: null },
          ],
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  if (key === 'portfolioId') return 'portfolio-1';
                  if (key === 'holdingId') return 'holding-1';
                  return null;
                },
              },
            },
          },
        },
        {
          provide: Router,
          useValue: { navigate: jest.fn() },
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);
    fixture = TestBed.createComponent(HoldingDetailComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    store.resetSelectors();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should dispatch load actions on init', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      fixture.detectChanges();

      expect(dispatchSpy).toHaveBeenCalledWith(
        HoldingsActions.loadHoldingDetails({
          portfolioId: 'portfolio-1',
          holdingId: 'holding-1',
        })
      );
      expect(dispatchSpy).toHaveBeenCalledWith(
        HoldingsActions.loadTransactions({ holdingId: 'holding-1' })
      );
    });

    it('should set error when route parameters are invalid', () => {
      const invalidRoute = TestBed.overrideProvider(ActivatedRoute, {
        useValue: {
          snapshot: {
            paramMap: {
              get: () => null,
            },
          },
        },
      });

      TestBed.createComponent(HoldingDetailComponent);
      fixture.detectChanges();

      expect(component.error()).toBe('Invalid route parameters');
    });
  });

  describe('Transaction Display', () => {
    it('should display transactions when data is loaded', () => {
      store.overrideSelector(HoldingsSelectors.selectSelectedHolding, mockHolding);
      store.overrideSelector(HoldingsSelectors.selectTransactionsSortedByDate, mockTransactions);
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const transactionRows = compiled.querySelectorAll('tbody tr');

      expect(transactionRows.length).toBe(3);
    });

    it('should display transaction details correctly', () => {
      store.overrideSelector(HoldingsSelectors.selectSelectedHolding, mockHolding);
      store.overrideSelector(HoldingsSelectors.selectTransactionsSortedByDate, [mockTransactions[0]]);
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const row = compiled.querySelector('tbody tr');

      expect(row?.textContent).toContain('BUY');
      expect(row?.textContent).toContain('1.50'); // quantity
    });

    it('should display BUY transactions with green badge', () => {
      store.overrideSelector(HoldingsSelectors.selectSelectedHolding, mockHolding);
      store.overrideSelector(HoldingsSelectors.selectTransactionsSortedByDate, [mockTransactions[0]]);
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const typeBadge = compiled.querySelector('.bg-green-100');

      expect(typeBadge).toBeTruthy();
      expect(typeBadge?.textContent?.trim()).toBe('BUY');
    });

    it('should display SELL transactions with red badge', () => {
      store.overrideSelector(HoldingsSelectors.selectSelectedHolding, mockHolding);
      store.overrideSelector(HoldingsSelectors.selectTransactionsSortedByDate, [mockTransactions[2]]);
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const typeBadge = compiled.querySelector('.bg-red-100');

      expect(typeBadge).toBeTruthy();
      expect(typeBadge?.textContent?.trim()).toBe('SELL');
    });

    it('should show empty state when no transactions exist', () => {
      store.overrideSelector(HoldingsSelectors.selectSelectedHolding, mockHolding);
      store.overrideSelector(HoldingsSelectors.selectTransactionsSortedByDate, []);
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyMessage = compiled.querySelector('.text-center');

      expect(emptyMessage?.textContent).toContain('No transactions yet');
    });

    it('should display transaction fee or dash when null', () => {
      const transactionWithoutFee: Transaction = {
        ...mockTransactions[0],
        fee: null,
      };

      store.overrideSelector(HoldingsSelectors.selectSelectedHolding, mockHolding);
      store.overrideSelector(HoldingsSelectors.selectTransactionsSortedByDate, [transactionWithoutFee]);
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const feeCell = compiled.querySelector('tbody tr td:last-child');

      expect(feeCell?.textContent?.trim()).toBe('-');
    });
  });

  describe('Holding Overview', () => {
    it('should display holding symbol and name', () => {
      store.overrideSelector(HoldingsSelectors.selectSelectedHolding, mockHolding);
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('BTC');
      expect(compiled.textContent).toContain('Bitcoin');
    });

    it('should display holding metrics (quantity, average cost, current value)', () => {
      store.overrideSelector(HoldingsSelectors.selectSelectedHolding, mockHolding);
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Quantity');
      expect(compiled.textContent).toContain('Average Cost');
      expect(compiled.textContent).toContain('Current Value');
    });

    it('should display gain/loss badge', () => {
      store.overrideSelector(HoldingsSelectors.selectSelectedHolding, mockHolding);
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const badge = compiled.querySelector('app-gain-loss-badge');

      expect(badge).toBeTruthy();
    });

    it('should display notes when present', () => {
      store.overrideSelector(HoldingsSelectors.selectSelectedHolding, mockHolding);
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Test holding');
    });

    it('should not display notes section when notes are null', () => {
      const holdingWithoutNotes = { ...mockHolding, notes: null };
      store.overrideSelector(HoldingsSelectors.selectSelectedHolding, holdingWithoutNotes);
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const notesSection = compiled.querySelector('.bg-blue-50');

      expect(notesSection).toBeFalsy();
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading indicator when loading', () => {
      store.overrideSelector(HoldingsSelectors.selectHoldingsLoading, true);
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Loading...');
    });

    it('should show error message when error occurs', () => {
      store.overrideSelector(HoldingsSelectors.selectHoldingsError, 'Failed to load holding');
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Failed to load holding');
    });
  });

  describe('User Interactions', () => {
    it('should call onBack when back button is clicked', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      store.overrideSelector(HoldingsSelectors.selectSelectedHolding, mockHolding);
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const backButton = compiled.querySelector('button') as HTMLButtonElement;
      backButton.click();

      expect(navigateSpy).toHaveBeenCalled();
    });

    it('should call onAddTransaction when add transaction button is clicked', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      store.overrideSelector(HoldingsSelectors.selectSelectedHolding, mockHolding);
      store.refreshState();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const addButton = compiled.querySelectorAll('button')[1] as HTMLButtonElement;
      addButton.click();

      expect(consoleSpy).toHaveBeenCalledWith('Add transaction clicked');
    });
  });

  describe('Cleanup', () => {
    it('should dispatch clearSelectedHolding on destroy', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      fixture.detectChanges();
      fixture.destroy();

      expect(dispatchSpy).toHaveBeenCalledWith(HoldingsActions.clearSelectedHolding());
    });
  });

  describe('Formatting Methods', () => {
    it('should format currency correctly', () => {
      const result = component.formatCurrency(35000);
      expect(result).toBe('$35,000.00');
    });

    it('should format small currency values with extended decimals', () => {
      const result = component.formatCurrency(0.00012345);
      expect(result).toBe('$0.00012345');
    });

    it('should format quantity correctly', () => {
      const result = component.formatQuantity(2.5);
      expect(result).toBe('2.50');
    });

    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = component.formatDate(date);
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });
});
