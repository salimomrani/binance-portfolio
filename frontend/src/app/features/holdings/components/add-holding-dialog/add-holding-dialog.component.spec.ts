// T092: Add Holding Dialog component tests

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AddHoldingDialogComponent } from './add-holding-dialog.component';

describe('AddHoldingDialogComponent', () => {
  let component: AddHoldingDialogComponent;
  let fixture: ComponentFixture<AddHoldingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddHoldingDialogComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AddHoldingDialogComponent);
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
    expect(form?.get('quantity')?.value).toBeNull();
    expect(form?.get('averageCost')?.value).toBeNull();
    expect(form?.get('notes')?.value).toBe('');
  });

  it('should validate required fields', () => {
    component.ngOnInit();
    const form = component['form']();
    expect(form?.valid).toBeFalsy();

    form?.patchValue({
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: 1,
      averageCost: 50000,
    });

    expect(form?.valid).toBeTruthy();
  });

  it('should validate symbol pattern', () => {
    component.ngOnInit();
    const form = component['form']();
    const symbolControl = form?.get('symbol');

    symbolControl?.setValue('btc');
    expect(symbolControl?.errors?.['pattern']).toBeTruthy();

    symbolControl?.setValue('BTC');
    expect(symbolControl?.errors).toBeNull();
  });

  it('should validate quantity range', () => {
    component.ngOnInit();
    const form = component['form']();
    const quantityControl = form?.get('quantity');

    quantityControl?.setValue(-1);
    expect(quantityControl?.errors?.['min']).toBeTruthy();

    quantityControl?.setValue(1000000001);
    expect(quantityControl?.errors?.['max']).toBeTruthy();

    quantityControl?.setValue(1);
    expect(quantityControl?.errors).toBeNull();
  });

  it('should emit close event when onClose is called', () => {
    component.ngOnInit();
    const closeSpy = jest.spyOn(component.close, 'emit');

    component.onClose();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should emit save event with valid form data', () => {
    component.ngOnInit();
    const form = component['form']();
    const saveSpy = jest.spyOn(component.save, 'emit');

    form?.patchValue({
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: 1.5,
      averageCost: 50000,
      notes: 'Test note',
    });

    component.onSubmit();

    expect(saveSpy).toHaveBeenCalledWith({
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: 1.5,
      averageCost: 50000,
      notes: 'Test note',
    });
  });

  it('should not emit save event with invalid form', () => {
    component.ngOnInit();
    const saveSpy = jest.spyOn(component.save, 'emit');

    component.onSubmit();

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should auto-uppercase symbol input', () => {
    component.ngOnInit();
    const form = component['form']();
    const mockEvent = {
      target: { value: 'btc' } as HTMLInputElement,
    } as Event;

    component.onSymbolInput(mockEvent);

    expect(form?.get('symbol')?.value).toBe('BTC');
  });

  it('should return correct error messages', () => {
    component.ngOnInit();
    const form = component['form']();
    const symbolControl = form?.get('symbol');

    symbolControl?.markAsTouched();
    symbolControl?.setValue('');
    expect(component.getErrorMessage('symbol')).toContain('required');

    symbolControl?.setValue('btc');
    expect(component.getErrorMessage('symbol')).toContain('uppercase letters');
  });

  it('should check if field has error', () => {
    component.ngOnInit();
    const form = component['form']();
    const symbolControl = form?.get('symbol');

    expect(component.hasError('symbol')).toBeFalsy();

    symbolControl?.markAsTouched();
    symbolControl?.setValue('');
    expect(component.hasError('symbol')).toBeTruthy();
  });
});
