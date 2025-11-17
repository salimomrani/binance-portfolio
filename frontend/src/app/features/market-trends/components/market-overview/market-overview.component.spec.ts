// T152: Market Overview Component Test

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketOverviewComponent } from './market-overview.component';
import { MarketDataApiService } from '../../services/market-data-api.service';
import { of, throwError } from 'rxjs';
import { CryptoPrice } from '../../../../shared/models/crypto-market-data.model';

describe('MarketOverviewComponent', () => {
  let component: MarketOverviewComponent;
  let fixture: ComponentFixture<MarketOverviewComponent>;
  let mockMarketDataApi: jasmine.SpyObj<MarketDataApiService>;

  const mockPrices: CryptoPrice[] = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 50000,
      change24h: 5.5,
      volume24h: 1000000000,
      marketCap: 900000000000,
      high24h: 51000,
      low24h: 49000,
      lastUpdated: new Date(),
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 3000,
      change24h: -2.3,
      volume24h: 500000000,
      marketCap: 350000000000,
      high24h: 3100,
      low24h: 2900,
      lastUpdated: new Date(),
    },
  ];

  beforeEach(async () => {
    mockMarketDataApi = jasmine.createSpyObj('MarketDataApiService', ['getMultiplePrices']);
    mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

    await TestBed.configureTestingModule({
      imports: [MarketOverviewComponent],
      providers: [{ provide: MarketDataApiService, useValue: mockMarketDataApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(MarketOverviewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load market data on init', () => {
    fixture.detectChanges();
    expect(mockMarketDataApi.getMultiplePrices).toHaveBeenCalled();
  });

  it('should separate gainers and losers correctly', () => {
    fixture.detectChanges();
    const gainers = component['topGainers']();
    const losers = component['topLosers']();

    expect(gainers.length).toBeGreaterThan(0);
    expect(losers.length).toBeGreaterThan(0);
    expect(gainers[0].change24h).toBeGreaterThan(losers[0].change24h);
  });

  it('should handle error state', () => {
    mockMarketDataApi.getMultiplePrices.and.returnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();

    expect(component['error']()).toBeTruthy();
    expect(component['loading']()).toBe(false);
  });

  it('should refresh data when refresh is called', () => {
    fixture.detectChanges();
    mockMarketDataApi.getMultiplePrices.calls.reset();

    component['refresh']();
    expect(mockMarketDataApi.getMultiplePrices).toHaveBeenCalled();
  });
});
