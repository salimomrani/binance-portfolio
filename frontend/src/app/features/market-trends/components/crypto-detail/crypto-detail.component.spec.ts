// T148: Crypto Detail Component Tests

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CryptoDetailComponent } from './crypto-detail.component';
import { MarketDataApiService } from '../../services/market-data-api.service';
import { CryptoMarketData } from '../../../../shared/models/crypto-market-data.model';

describe('CryptoDetailComponent', () => {
  let component: CryptoDetailComponent;
  let fixture: ComponentFixture<CryptoDetailComponent>;
  let mockMarketDataApi: jasmine.SpyObj<MarketDataApiService>;
  let mockActivatedRoute: any;

  const mockCryptoData: CryptoMarketData = {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 45000,
    change1h: 1.5,
    change24h: 3.2,
    change7d: 5.8,
    change30d: -2.1,
    volume24h: 25000000000,
    marketCap: 850000000000,
    high24h: 46000,
    low24h: 44000,
    lastUpdated: new Date(),
  };

  beforeEach(async () => {
    mockMarketDataApi = jasmine.createSpyObj('MarketDataApiService', ['getCryptoMarketData']);
    mockActivatedRoute = {
      params: of({ symbol: 'BTC' }),
    };

    await TestBed.configureTestingModule({
      imports: [CryptoDetailComponent],
      providers: [
        { provide: MarketDataApiService, useValue: mockMarketDataApi },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CryptoDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load crypto data on init', (done) => {
    mockMarketDataApi.getCryptoMarketData.and.returnValue(of(mockCryptoData));

    fixture.detectChanges();

    setTimeout(() => {
      expect(mockMarketDataApi.getCryptoMarketData).toHaveBeenCalledWith('BTC');
      expect(component.cryptoData()).toEqual(mockCryptoData);
      expect(component.loading()).toBe(false);
      done();
    }, 100);
  });

  it('should display crypto name and symbol', (done) => {
    mockMarketDataApi.getCryptoMarketData.and.returnValue(of(mockCryptoData));

    fixture.detectChanges();

    setTimeout(() => {
      expect(component.name()).toBe('Bitcoin');
      expect(component.symbol()).toBe('BTC');
      done();
    }, 100);
  });

  it('should format price correctly', (done) => {
    mockMarketDataApi.getCryptoMarketData.and.returnValue(of(mockCryptoData));

    fixture.detectChanges();

    setTimeout(() => {
      const formatted = component.priceFormatted();
      expect(formatted).toContain('45,000');
      done();
    }, 100);
  });

  it('should handle error when loading fails', (done) => {
    const errorMessage = 'Failed to load data';
    mockMarketDataApi.getCryptoMarketData.and.returnValue(
      throwError(() => new Error(errorMessage))
    );

    fixture.detectChanges();

    setTimeout(() => {
      expect(component.error()).toBe(errorMessage);
      expect(component.loading()).toBe(false);
      done();
    }, 100);
  });

  it('should format large numbers correctly', () => {
    expect(component['formatLargeNumber'](1_500_000_000_000)).toBe('$1.50T');
    expect(component['formatLargeNumber'](45_000_000_000)).toBe('$45.00B');
    expect(component['formatLargeNumber'](250_000_000)).toBe('$250.00M');
    expect(component['formatLargeNumber'](1_500_000)).toBe('$1.50M');
  });
});
