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
});
