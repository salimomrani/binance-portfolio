// T148, T160: Crypto Detail Component Tests

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CryptoDetailComponent } from './crypto-detail.component';
import { MarketDataApiService } from '../../services/market-data-api.service';
import { CryptoMarketData } from '../../../../shared/models/crypto-market-data.model';

describe('CryptoDetailComponent', () => {
  let component: CryptoDetailComponent;
  let fixture: ComponentFixture<CryptoDetailComponent>;
  let mockMarketDataApi: jasmine.SpyObj<MarketDataApiService>;
  let mockActivatedRoute: any;
  let mockRouter: jasmine.SpyObj<Router>;

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
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      params: of({ symbol: 'BTC' }),
    };

    await TestBed.configureTestingModule({
      imports: [CryptoDetailComponent],
      providers: [
        { provide: MarketDataApiService, useValue: mockMarketDataApi },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
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

  // T160: Additional comprehensive tests for crypto detail display
  describe('Price Formatting', () => {
    it('should format prices above $1 with 2 decimals', (done) => {
      const data = { ...mockCryptoData, price: 45678.91 };
      mockMarketDataApi.getCryptoMarketData.and.returnValue(of(data));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.priceFormatted()).toBe('45,678.91');
        done();
      }, 100);
    });

    it('should format prices below $1 with 8 decimals', (done) => {
      const data = { ...mockCryptoData, price: 0.00012345 };
      mockMarketDataApi.getCryptoMarketData.and.returnValue(of(data));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.priceFormatted()).toBe('0.00012345');
        done();
      }, 100);
    });
  });

  describe('Volume and Market Cap Display', () => {
    it('should display formatted volume', (done) => {
      mockMarketDataApi.getCryptoMarketData.and.returnValue(of(mockCryptoData));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.volumeFormatted()).toBe('$25.00B');
        done();
      }, 100);
    });

    it('should display formatted market cap', (done) => {
      mockMarketDataApi.getCryptoMarketData.and.returnValue(of(mockCryptoData));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.marketCapFormatted()).toBe('$850.00B');
        done();
      }, 100);
    });
  });

  describe('24h Price Range', () => {
    it('should display 24h high/low range', (done) => {
      mockMarketDataApi.getCryptoMarketData.and.returnValue(of(mockCryptoData));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.priceRange24h()).toBe('$44000.00 - $46000.00');
        done();
      }, 100);
    });

    it('should display N/A when high/low not available', (done) => {
      const data = { ...mockCryptoData, high24h: null, low24h: null };
      mockMarketDataApi.getCryptoMarketData.and.returnValue(of(data));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.priceRange24h()).toBe('N/A');
        done();
      }, 100);
    });
  });

  describe('Timeframe Selection', () => {
    it('should initialize with 7d timeframe', () => {
      expect(component.selectedTimeframe()).toBe('7d');
    });

    it('should update timeframe when selectTimeframe is called', () => {
      component.selectTimeframe('30d');
      expect(component.selectedTimeframe()).toBe('30d');
    });

    it('should have all available timeframes', () => {
      expect(component.timeframes).toEqual(['24h', '7d', '30d', '1y']);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', (done) => {
      mockMarketDataApi.getCryptoMarketData.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.error()).toBe('Network error');
        expect(component.loading()).toBe(false);
        expect(component.cryptoData()).toBeNull();
        done();
      }, 100);
    });

    it('should display error when no symbol provided', (done) => {
      mockActivatedRoute.params = of({});

      fixture = TestBed.createComponent(CryptoDetailComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.error()).toBe('No symbol provided');
        expect(component.loading()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Loading State', () => {
    it('should set loading to true initially', () => {
      mockMarketDataApi.getCryptoMarketData.and.returnValue(of(mockCryptoData));
      expect(component.loading()).toBe(true);
    });

    it('should set loading to false after data loads', (done) => {
      mockMarketDataApi.getCryptoMarketData.and.returnValue(of(mockCryptoData));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.loading()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Computed Properties', () => {
    it('should return empty string for symbol when no data', () => {
      expect(component.symbol()).toBe('');
    });

    it('should return empty string for name when no data', () => {
      expect(component.name()).toBe('');
    });

    it('should return 0 for price when no data', () => {
      expect(component.price()).toBe(0);
    });

    it('should compute correct values when data is loaded', (done) => {
      mockMarketDataApi.getCryptoMarketData.and.returnValue(of(mockCryptoData));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.symbol()).toBe('BTC');
        expect(component.name()).toBe('Bitcoin');
        expect(component.price()).toBe(45000);
        done();
      }, 100);
    });
  });

  describe('Navigation', () => {
    it('should navigate back to portfolio when goBack is called', () => {
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/portfolio']);
    });
  });

  describe('Component Lifecycle', () => {
    it('should load data on init', (done) => {
      mockMarketDataApi.getCryptoMarketData.and.returnValue(of(mockCryptoData));

      component.ngOnInit();
      fixture.detectChanges();

      setTimeout(() => {
        expect(mockMarketDataApi.getCryptoMarketData).toHaveBeenCalled();
        expect(component.cryptoData()).not.toBeNull();
        done();
      }, 100);
    });

    it('should cleanup on destroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large market cap values', (done) => {
      const data = { ...mockCryptoData, marketCap: 5_000_000_000_000 };
      mockMarketDataApi.getCryptoMarketData.and.returnValue(of(data));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.marketCapFormatted()).toBe('$5.00T');
        done();
      }, 100);
    });

    it('should handle very small volume values', (done) => {
      const data = { ...mockCryptoData, volume24h: 500 };
      mockMarketDataApi.getCryptoMarketData.and.returnValue(of(data));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.volumeFormatted()).toBe('$500.00');
        done();
      }, 100);
    });

    it('should handle zero values gracefully', (done) => {
      const data = {
        ...mockCryptoData,
        price: 0,
        volume24h: 0,
        marketCap: 0
      };
      mockMarketDataApi.getCryptoMarketData.and.returnValue(of(data));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.price()).toBe(0);
        expect(component.volumeFormatted()).toBe('$0.00');
        expect(component.marketCapFormatted()).toBe('$0.00');
        done();
      }, 100);
    });
  });
});
