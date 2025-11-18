// T181: Add to Watchlist Dialog component tests

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddToWatchlistDialogComponent } from './add-to-watchlist-dialog.component';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { AddToWatchlistRequest } from '../../../../shared/models/watchlist.model';
import { selectIsInWatchlist } from '../../store/watchlist.selectors';

describe('AddToWatchlistDialogComponent', () => {
  let component: AddToWatchlistDialogComponent;
  let fixture: ComponentFixture<AddToWatchlistDialogComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddToWatchlistDialogComponent],
      providers: [
        provideMockStore({
          selectors: [],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(AddToWatchlistDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    component.ngOnInit();
    const form = component['form']();

    expect(form).toBeTruthy();
    expect(form?.get('symbol')?.value).toBe('');
    expect(form?.get('name')?.value).toBe('');
    expect(form?.get('notes')?.value).toBe('');
  });

  it('should validate required fields', () => {
    component.ngOnInit();
    const form = component['form']();

    expect(form?.valid).toBeFalsy();

    form?.patchValue({
      symbol: 'BTC',
      name: 'Bitcoin',
    });

    expect(form?.valid).toBeTruthy();
  });

  it('should validate symbol pattern (uppercase letters only)', () => {
    component.ngOnInit();
    const symbolControl = component['form']()?.get('symbol');

    symbolControl?.setValue('btc');
    expect(symbolControl?.hasError('pattern')).toBeTruthy();

    symbolControl?.setValue('BTC123');
    expect(symbolControl?.hasError('pattern')).toBeTruthy();

    symbolControl?.setValue('BTC');
    expect(symbolControl?.hasError('pattern')).toBeFalsy();
  });

  it('should auto-uppercase symbol input', () => {
    component.ngOnInit();
    const event = {
      target: { value: 'btc' },
    } as unknown as Event;

    component.onSymbolInput(event);

    const symbolValue = component['form']()?.get('symbol')?.value;
    expect(symbolValue).toBe('BTC');
  });

  it('should show suggestions when typing', () => {
    component.ngOnInit();
    expect(component['showSuggestions']()).toBeFalsy();

    const event = {
      target: { value: 'BTC' },
    } as unknown as Event;

    component.onSymbolInput(event);

    expect(component['showSuggestions']()).toBeTruthy();
    expect(component['searchQuery']()).toBe('BTC');
  });

  it('should filter crypto suggestions based on search query', () => {
    component.ngOnInit();
    component['searchQuery'].set('BTC');

    const filtered = component['filteredCryptos']();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.some((c) => c.symbol === 'BTC')).toBeTruthy();
  });

  it('should select crypto from suggestions', () => {
    component.ngOnInit();
    const crypto = { symbol: 'ETH', name: 'Ethereum' };

    component.selectCrypto(crypto);

    expect(component['form']()?.get('symbol')?.value).toBe('ETH');
    expect(component['form']()?.get('name')?.value).toBe('Ethereum');
    expect(component['showSuggestions']()).toBeFalsy();
  });

  it('should emit save event with valid form data', () => {
    component.ngOnInit();
    spyOn(component.save, 'emit');

    // Mock isInWatchlist selector to return false
    store.overrideSelector(selectIsInWatchlist('BTC'), false);

    const form = component['form']();
    form?.patchValue({
      symbol: 'BTC',
      name: 'Bitcoin',
      notes: 'Watching this',
    });

    component.onSubmit();

    const expected: AddToWatchlistRequest = {
      symbol: 'BTC',
      name: 'Bitcoin',
      notes: 'Watching this',
    };

    expect(component.save.emit).toHaveBeenCalledWith(expected);
  });

  it('should not submit with invalid form', () => {
    component.ngOnInit();
    spyOn(component.save, 'emit');

    component.onSubmit();

    expect(component.save.emit).not.toHaveBeenCalled();
  });

  it('should show alert if crypto already in watchlist', () => {
    component.ngOnInit();
    spyOn(window, 'alert');
    spyOn(component.save, 'emit');

    // Mock isInWatchlist selector to return true
    store.overrideSelector(selectIsInWatchlist('BTC'), true);

    const form = component['form']();
    form?.patchValue({
      symbol: 'BTC',
      name: 'Bitcoin',
    });

    component.onSubmit();

    expect(window.alert).toHaveBeenCalledWith('BTC is already in your watchlist');
    expect(component.save.emit).not.toHaveBeenCalled();
  });

  it('should emit close event and reset form', () => {
    component.ngOnInit();
    spyOn(component.close, 'emit');

    const form = component['form']();
    form?.patchValue({
      symbol: 'BTC',
      name: 'Bitcoin',
    });

    component.onClose();

    expect(component.close.emit).toHaveBeenCalled();
    expect(form?.get('symbol')?.value).toBeNull();
    expect(form?.get('name')?.value).toBeNull();
  });

  it('should display correct error messages', () => {
    component.ngOnInit();
    const form = component['form']();
    const symbolControl = form?.get('symbol');

    symbolControl?.markAsTouched();
    expect(component.getErrorMessage('symbol')).toBe('Symbol is required');

    symbolControl?.setValue('btc');
    expect(component.getErrorMessage('symbol')).toBe(
      'Symbol must contain only uppercase letters'
    );
  });

  it('should check if form control has error', () => {
    component.ngOnInit();
    const form = component['form']();
    const symbolControl = form?.get('symbol');

    expect(component.hasError('symbol')).toBeFalsy();

    symbolControl?.markAsTouched();
    expect(component.hasError('symbol')).toBeTruthy();

    symbolControl?.setValue('BTC');
    expect(component.hasError('symbol')).toBeFalsy();
  });

  it('should hide suggestions on blur after delay', (done) => {
    component.ngOnInit();
    component['showSuggestions'].set(true);

    component.onSymbolBlur();

    expect(component['showSuggestions']()).toBeTruthy(); // Still true immediately

    setTimeout(() => {
      expect(component['showSuggestions']()).toBeFalsy(); // False after delay
      done();
    }, 250);
  });
});
