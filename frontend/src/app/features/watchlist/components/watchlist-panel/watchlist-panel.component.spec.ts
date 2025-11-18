// T180: Watchlist panel component tests

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WatchlistPanelComponent } from './watchlist-panel.component';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { PriceUpdateService } from '../../../../core/services/price-update.service';
import { WatchlistItem } from '../../../../shared/models/watchlist.model';
import {
  selectAllWatchlistItems,
  selectWatchlistLoading,
  selectWatchlistError,
} from '../../store/watchlist.selectors';

describe('WatchlistPanelComponent', () => {
  let component: WatchlistPanelComponent;
  let fixture: ComponentFixture<WatchlistPanelComponent>;
  let store: MockStore;
  let priceUpdateService: jasmine.SpyObj<PriceUpdateService>;

  const mockWatchlistItems: WatchlistItem[] = [
    {
      id: '1',
      symbol: 'BTC',
      name: 'Bitcoin',
      currentPrice: 45000,
      change1h: 0.5,
      change24h: 2.3,
      change7d: 5.1,
      volume24h: 25000000000,
      marketCap: 850000000000,
      trend: 'up' as const,
      notes: 'Test note',
      addedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      symbol: 'ETH',
      name: 'Ethereum',
      currentPrice: 3000,
      change1h: -0.2,
      change24h: -1.5,
      change7d: 3.2,
      volume24h: 15000000000,
      marketCap: 360000000000,
      trend: 'down' as const,
      notes: null,
      addedAt: new Date('2024-01-02'),
    },
  ];

  beforeEach(async () => {
    const priceUpdateServiceSpy = jasmine.createSpyObj('PriceUpdateService', [
      'getPriceForSymbol',
    ]);

    await TestBed.configureTestingModule({
      imports: [WatchlistPanelComponent],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectAllWatchlistItems, value: [] },
            { selector: selectWatchlistLoading, value: false },
            { selector: selectWatchlistError, value: null },
          ],
        }),
        { provide: PriceUpdateService, useValue: priceUpdateServiceSpy },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    priceUpdateService = TestBed.inject(
      PriceUpdateService
    ) as jasmine.SpyObj<PriceUpdateService>;
    fixture = TestBed.createComponent(WatchlistPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display empty state when no watchlist items', () => {
    store.overrideSelector(selectAllWatchlistItems, []);
    store.overrideSelector(selectWatchlistLoading, false);
    store.overrideSelector(selectWatchlistError, null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.text-center')?.textContent).toContain(
      'No cryptocurrencies in watchlist'
    );
  });

  it('should display loading state', () => {
    store.overrideSelector(selectAllWatchlistItems, []);
    store.overrideSelector(selectWatchlistLoading, true);
    store.overrideSelector(selectWatchlistError, null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.animate-spin')).toBeTruthy();
  });

  it('should display error state', () => {
    const errorMessage = 'Failed to load watchlist';
    store.overrideSelector(selectAllWatchlistItems, []);
    store.overrideSelector(selectWatchlistLoading, false);
    store.overrideSelector(selectWatchlistError, errorMessage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.bg-red-50')?.textContent).toContain(
      errorMessage
    );
  });

  it('should display watchlist items in table', () => {
    store.overrideSelector(selectAllWatchlistItems, mockWatchlistItems);
    store.overrideSelector(selectWatchlistLoading, false);
    store.overrideSelector(selectWatchlistError, null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should sort items by column', () => {
    store.overrideSelector(selectAllWatchlistItems, mockWatchlistItems);
    fixture.detectChanges();

    // Initial sort by symbol ascending
    expect(component['sortColumn']()).toBe('symbol');
    expect(component['sortOrder']()).toBe('asc');

    // Sort by price
    component.onSort('currentPrice');
    expect(component['sortColumn']()).toBe('currentPrice');
    expect(component['sortOrder']()).toBe('asc');

    // Toggle price sort order
    component.onSort('currentPrice');
    expect(component['sortColumn']()).toBe('currentPrice');
    expect(component['sortOrder']()).toBe('desc');
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(45000)).toBe('$45,000.00');
    expect(component.formatCurrency(3000.5)).toBe('$3,000.50');
  });

  it('should format percentage correctly', () => {
    expect(component.formatPercentage(2.3)).toBe('+2.30%');
    expect(component.formatPercentage(-1.5)).toBe('-1.50%');
  });

  it('should format large numbers correctly', () => {
    expect(component.formatLargeNumber(25000000000)).toBe('$25.00B');
    expect(component.formatLargeNumber(850000000000)).toBe('$850.00B');
    expect(component.formatLargeNumber(1500000000000)).toBe('$1.50T');
    expect(component.formatLargeNumber(5000000)).toBe('$5.00M');
    expect(component.formatLargeNumber(7500)).toBe('$7.50K');
  });

  it('should emit addToWatchlist event', () => {
    spyOn(component.addToWatchlist, 'emit');
    component.onAddToWatchlist();
    expect(component.addToWatchlist.emit).toHaveBeenCalled();
  });

  it('should dispatch remove action when removing item', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const dispatchSpy = spyOn(store, 'dispatch');

    component.onRemove('1');

    expect(window.confirm).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('should not dispatch remove action when user cancels', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    const dispatchSpy = spyOn(store, 'dispatch');

    component.onRemove('1');

    expect(window.confirm).toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
