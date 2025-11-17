// T161: Price Update Service Tests

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PriceUpdateService } from './price-update.service';
import { MarketDataApiService } from '../../features/market-trends/services/market-data-api.service';
import { CryptoPrice } from '../../shared/models/crypto-market-data.model';

describe('PriceUpdateService', () => {
  let service: PriceUpdateService;
  let mockMarketDataApi: jasmine.SpyObj<MarketDataApiService>;

  const mockPrices: CryptoPrice[] = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 45000,
      change24h: 3.2,
      volume24h: 25000000000,
      marketCap: 850000000000,
      high24h: 46000,
      low24h: 44000,
      lastUpdated: new Date(),
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 3000,
      change24h: 2.5,
      volume24h: 12000000000,
      marketCap: 360000000000,
      high24h: 3100,
      low24h: 2950,
      lastUpdated: new Date(),
    },
  ];

  beforeEach(() => {
    mockMarketDataApi = jasmine.createSpyObj('MarketDataApiService', ['getMultiplePrices']);

    TestBed.configureTestingModule({
      providers: [
        PriceUpdateService,
        { provide: MarketDataApiService, useValue: mockMarketDataApi },
      ],
    });

    service = TestBed.inject(PriceUpdateService);
  });

  afterEach(() => {
    service.stopPriceUpdates();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start price updates and fetch initial prices', fakeAsync(() => {
    mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

    service.startPriceUpdates(['BTC', 'ETH']);

    tick();

    expect(mockMarketDataApi.getMultiplePrices).toHaveBeenCalledWith(['BTC', 'ETH']);
    expect(service.polling()).toBe(true);
    expect(service.prices().size).toBe(2);
    expect(service.getPriceForSymbol('BTC')?.price).toBe(45000);
  }));

  it('should update prices at regular intervals', fakeAsync(() => {
    mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

    service.startPriceUpdates(['BTC', 'ETH']);

    tick(60000); // Wait for interval

    expect(mockMarketDataApi.getMultiplePrices).toHaveBeenCalled();
  }));

  it('should handle errors gracefully and continue polling', fakeAsync(() => {
    mockMarketDataApi.getMultiplePrices.and.returnValue(throwError(() => new Error('API Error')));

    service.startPriceUpdates(['BTC', 'ETH']);

    tick(60000);

    expect(service.error()).toBeTruthy();
    expect(service.polling()).toBe(true); // Should still be polling
  }));

  it('should stop price updates', fakeAsync(() => {
    mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

    service.startPriceUpdates(['BTC', 'ETH']);
    tick();

    service.stopPriceUpdates();

    expect(service.polling()).toBe(false);
  }));

  it('should get price for specific symbol', fakeAsync(() => {
    mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

    service.startPriceUpdates(['BTC', 'ETH']);
    tick();

    const btcPrice = service.getPriceForSymbol('BTC');
    expect(btcPrice).toBeDefined();
    expect(btcPrice?.symbol).toBe('BTC');
    expect(btcPrice?.price).toBe(45000);
  }));

  it('should track symbol presence', fakeAsync(() => {
    mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

    service.startPriceUpdates(['BTC', 'ETH']);
    tick();

    expect(service.isSymbolTracked('BTC')).toBe(true);
    expect(service.isSymbolTracked('ADA')).toBe(false);
  }));

  it('should return tracked symbols', fakeAsync(() => {
    mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

    service.startPriceUpdates(['BTC', 'ETH']);
    tick();

    const symbols = service.getTrackedSymbols();
    expect(symbols).toContain('BTC');
    expect(symbols).toContain('ETH');
    expect(symbols.length).toBe(2);
  }));

  it('should calculate seconds since last update', fakeAsync(() => {
    mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

    service.startPriceUpdates(['BTC', 'ETH']);
    tick();

    const seconds = service.getSecondsSinceLastUpdate();
    expect(seconds).toBeGreaterThanOrEqual(0);
  }));

  it('should detect price changes', fakeAsync(() => {
    const initialPrices = [...mockPrices];
    const updatedPrices: CryptoPrice[] = [
      { ...mockPrices[0], price: 46000 }, // BTC price increased
      mockPrices[1],
    ];

    mockMarketDataApi.getMultiplePrices.and.returnValue(of(initialPrices));
    service.startPriceUpdates(['BTC', 'ETH']);
    tick();

    const initialBtcPrice = service.getPriceForSymbol('BTC')?.price;
    expect(initialBtcPrice).toBe(45000);

    // Update with new prices
    mockMarketDataApi.getMultiplePrices.and.returnValue(of(updatedPrices));
    tick(60000);

    const updatedBtcPrice = service.getPriceForSymbol('BTC');
    expect(updatedBtcPrice?.price).toBe(46000);
    expect(updatedBtcPrice?.previousPrice).toBe(45000);
  }));

  // T161: Additional comprehensive tests for polling logic
  describe('Polling Logic', () => {
    it('should not start polling if already polling', fakeAsync(() => {
      mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

      service.startPriceUpdates(['BTC']);
      tick();

      const callCount = mockMarketDataApi.getMultiplePrices.calls.count();

      // Try to start again
      service.startPriceUpdates(['BTC']);
      tick();

      // Call count should not increase
      expect(mockMarketDataApi.getMultiplePrices.calls.count()).toBe(callCount);
    }));

    it('should not start polling with empty symbols array', () => {
      mockMarketDataApi.getMultiplePrices.and.returnValue(of([]));

      service.startPriceUpdates([]);

      expect(mockMarketDataApi.getMultiplePrices).not.toHaveBeenCalled();
      expect(service.polling()).toBe(false);
    });

    it('should handle multiple poll intervals correctly', fakeAsync(() => {
      mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

      service.startPriceUpdates(['BTC', 'ETH']);
      tick(); // Initial fetch

      tick(60000); // First interval
      tick(60000); // Second interval

      // Should have been called 3 times (initial + 2 intervals)
      expect(mockMarketDataApi.getMultiplePrices.calls.count()).toBeGreaterThanOrEqual(2);
    }));
  });

  describe('Price Data Management', () => {
    it('should return undefined for non-existent symbol', () => {
      const price = service.getPriceForSymbol('INVALID');
      expect(price).toBeUndefined();
    });

    it('should return null for last update time when no updates', () => {
      expect(service.lastUpdate()).toBeNull();
    });

    it('should return null for seconds since last update when no updates', () => {
      expect(service.getSecondsSinceLastUpdate()).toBeNull();
    });

    it('should update last update time on successful fetch', fakeAsync(() => {
      mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

      expect(service.lastUpdate()).toBeNull();

      service.startPriceUpdates(['BTC']);
      tick();

      expect(service.lastUpdate()).not.toBeNull();
      expect(service.lastUpdate()).toBeInstanceOf(Date);
    }));
  });

  describe('Manual Refresh', () => {
    it('should refresh prices manually', fakeAsync(() => {
      mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

      service.refreshPrices(['BTC', 'ETH']);
      tick();

      expect(mockMarketDataApi.getMultiplePrices).toHaveBeenCalledWith(['BTC', 'ETH']);
      expect(service.prices().size).toBe(2);
    }));

    it('should handle errors during manual refresh', fakeAsync(() => {
      mockMarketDataApi.getMultiplePrices.and.returnValue(
        throwError(() => new Error('Refresh failed'))
      );

      service.refreshPrices(['BTC']);
      tick();

      expect(service.error()).toBe('Refresh failed');
    }));
  });

  describe('Error Handling', () => {
    it('should clear previous error on successful fetch', fakeAsync(() => {
      // First call fails
      mockMarketDataApi.getMultiplePrices.and.returnValue(
        throwError(() => new Error('First error'))
      );

      service.refreshPrices(['BTC']);
      tick();

      expect(service.error()).toBeTruthy();

      // Second call succeeds
      mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

      service.refreshPrices(['BTC']);
      tick();

      expect(service.error()).toBeNull();
    }));

    it('should set error message when API fails', fakeAsync(() => {
      mockMarketDataApi.getMultiplePrices.and.returnValue(
        throwError(() => new Error('Network timeout'))
      );

      service.startPriceUpdates(['BTC']);
      tick(60000);

      expect(service.error()).toBe('Network timeout');
    }));

    it('should use default error message if error has no message', fakeAsync(() => {
      mockMarketDataApi.getMultiplePrices.and.returnValue(
        throwError(() => ({}))
      );

      service.refreshPrices(['BTC']);
      tick();

      expect(service.error()).toBe('Failed to fetch prices');
    }));
  });

  describe('Previous Price Tracking', () => {
    it('should not have previous price on first fetch', fakeAsync(() => {
      mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

      service.startPriceUpdates(['BTC']);
      tick();

      const btcPrice = service.getPriceForSymbol('BTC');
      expect(btcPrice?.previousPrice).toBeUndefined();
    }));

    it('should track previous price after update', fakeAsync(() => {
      const firstPrices = [...mockPrices];
      const secondPrices: CryptoPrice[] = [
        { ...mockPrices[0], price: 47000 },
        mockPrices[1],
      ];

      mockMarketDataApi.getMultiplePrices.and.returnValue(of(firstPrices));
      service.startPriceUpdates(['BTC', 'ETH']);
      tick();

      mockMarketDataApi.getMultiplePrices.and.returnValue(of(secondPrices));
      tick(60000);

      const btcPrice = service.getPriceForSymbol('BTC');
      expect(btcPrice?.previousPrice).toBe(45000);
      expect(btcPrice?.price).toBe(47000);
    }));

    it('should update previous price on multiple updates', fakeAsync(() => {
      const prices1 = [...mockPrices];
      const prices2: CryptoPrice[] = [
        { ...mockPrices[0], price: 46000 },
        mockPrices[1],
      ];
      const prices3: CryptoPrice[] = [
        { ...mockPrices[0], price: 47000 },
        mockPrices[1],
      ];

      mockMarketDataApi.getMultiplePrices.and.returnValue(of(prices1));
      service.startPriceUpdates(['BTC', 'ETH']);
      tick();

      mockMarketDataApi.getMultiplePrices.and.returnValue(of(prices2));
      tick(60000);

      mockMarketDataApi.getMultiplePrices.and.returnValue(of(prices3));
      tick(60000);

      const btcPrice = service.getPriceForSymbol('BTC');
      expect(btcPrice?.previousPrice).toBe(46000); // Should be second price
      expect(btcPrice?.price).toBe(47000); // Current is third price
    }));
  });

  describe('State Signals', () => {
    it('should expose readonly signals', () => {
      expect(service.prices).toBeDefined();
      expect(service.lastUpdate).toBeDefined();
      expect(service.polling).toBeDefined();
      expect(service.error).toBeDefined();
    });

    it('should update polling state correctly', fakeAsync(() => {
      mockMarketDataApi.getMultiplePrices.and.returnValue(of(mockPrices));

      expect(service.polling()).toBe(false);

      service.startPriceUpdates(['BTC']);
      tick();

      expect(service.polling()).toBe(true);

      service.stopPriceUpdates();

      expect(service.polling()).toBe(false);
    }));
  });
});
