// T087 & T092: Add holding dialog component tests

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AddHoldingDialogComponent } from './add-holding-dialog.component';

describe('AddHoldingDialogComponent', () => {
  let component: AddHoldingDialogComponent;
  let fixture: ComponentFixture<AddHoldingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddHoldingDialogComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AddHoldingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty values', () => {
      expect(component.holdingForm.value).toEqual({
        symbol: '',
        name: '',
        quantity: null,
        averageCost: null,
        notes: ''
      });
    });

    it('should have form controls defined', () => {
      expect(component.holdingForm.get('symbol')).toBeDefined();
      expect(component.holdingForm.get('name')).toBeDefined();
      expect(component.holdingForm.get('quantity')).toBeDefined();
      expect(component.holdingForm.get('averageCost')).toBeDefined();
      expect(component.holdingForm.get('notes')).toBeDefined();
    });
  });

  describe('Dialog State Management', () => {
    it('should start with dialog closed', () => {
      expect(component.isOpen()).toBe(false);
    });

    it('should open dialog when open() is called', () => {
      component.open();
      expect(component.isOpen()).toBe(true);
    });

    it('should close dialog when close() is called', () => {
      component.open();
      component.close();
      expect(component.isOpen()).toBe(false);
    });

    it('should emit closeDialog event when closing', () => {
      spyOn(component.closeDialog, 'emit');
      component.open();
      component.close();
      expect(component.closeDialog.emit).toHaveBeenCalled();
    });

    it('should reset form when opening dialog', () => {
      component.holdingForm.patchValue({
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1.5,
        averageCost: 45000
      });
      component.open();
      expect(component.holdingForm.value.symbol).toBe(null);
    });
  });

  describe('Form Validation - Symbol', () => {
    it('should require symbol field', () => {
      const symbol = component.holdingForm.get('symbol');
      symbol?.setValue('');
      expect(symbol?.hasError('required')).toBe(true);
    });

    it('should accept valid symbol', () => {
      const symbol = component.holdingForm.get('symbol');
      symbol?.setValue('BTC');
      expect(symbol?.valid).toBe(true);
    });

    it('should reject symbol with lowercase letters', () => {
      const symbol = component.holdingForm.get('symbol');
      symbol?.setValue('btc');
      expect(symbol?.hasError('pattern')).toBe(true);
    });

    it('should reject symbol longer than 10 characters', () => {
      const symbol = component.holdingForm.get('symbol');
      symbol?.setValue('VERYLONGSYMBOL');
      expect(symbol?.hasError('maxLength')).toBe(true);
    });
  });

  describe('Form Validation - Name', () => {
    it('should require name field', () => {
      const name = component.holdingForm.get('name');
      name?.setValue('');
      expect(name?.hasError('required')).toBe(true);
    });

    it('should accept valid name', () => {
      const name = component.holdingForm.get('name');
      name?.setValue('Bitcoin');
      expect(name?.valid).toBe(true);
    });

    it('should reject name longer than 100 characters', () => {
      const name = component.holdingForm.get('name');
      name?.setValue('A'.repeat(101));
      expect(name?.hasError('maxLength')).toBe(true);
    });
  });

  describe('Form Validation - Quantity', () => {
    it('should require quantity field', () => {
      const quantity = component.holdingForm.get('quantity');
      quantity?.setValue(null);
      expect(quantity?.hasError('required')).toBe(true);
    });

    it('should reject negative quantity', () => {
      const quantity = component.holdingForm.get('quantity');
      quantity?.setValue(-1);
      expect(quantity?.hasError('min')).toBe(true);
    });

    it('should reject zero quantity', () => {
      const quantity = component.holdingForm.get('quantity');
      quantity?.setValue(0);
      expect(quantity?.hasError('min')).toBe(true);
    });

    it('should accept positive quantity', () => {
      const quantity = component.holdingForm.get('quantity');
      quantity?.setValue(1.5);
      expect(quantity?.valid).toBe(true);
    });

    it('should reject quantity exceeding maximum', () => {
      const quantity = component.holdingForm.get('quantity');
      quantity?.setValue(1000000001);
      expect(quantity?.hasError('max')).toBe(true);
    });
  });

  describe('Form Validation - Average Cost', () => {
    it('should require averageCost field', () => {
      const averageCost = component.holdingForm.get('averageCost');
      averageCost?.setValue(null);
      expect(averageCost?.hasError('required')).toBe(true);
    });

    it('should reject negative average cost', () => {
      const averageCost = component.holdingForm.get('averageCost');
      averageCost?.setValue(-100);
      expect(averageCost?.hasError('min')).toBe(true);
    });

    it('should accept positive average cost', () => {
      const averageCost = component.holdingForm.get('averageCost');
      averageCost?.setValue(45000);
      expect(averageCost?.valid).toBe(true);
    });

    it('should reject average cost exceeding maximum', () => {
      const averageCost = component.holdingForm.get('averageCost');
      averageCost?.setValue(10000001);
      expect(averageCost?.hasError('max')).toBe(true);
    });
  });

  describe('Form Validation - Notes', () => {
    it('should be optional', () => {
      const notes = component.holdingForm.get('notes');
      notes?.setValue('');
      expect(notes?.valid).toBe(true);
    });

    it('should accept valid notes', () => {
      const notes = component.holdingForm.get('notes');
      notes?.setValue('My first Bitcoin purchase');
      expect(notes?.valid).toBe(true);
    });

    it('should reject notes longer than 1000 characters', () => {
      const notes = component.holdingForm.get('notes');
      notes?.setValue('A'.repeat(1001));
      expect(notes?.hasError('maxLength')).toBe(true);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.holdingForm.patchValue({
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1.5,
        averageCost: 45000,
        notes: 'Test holding'
      });
    });

    it('should emit submitHolding event with valid form data', () => {
      spyOn(component.submitHolding, 'emit');
      component.onSubmit();
      expect(component.submitHolding.emit).toHaveBeenCalledWith({
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1.5,
        averageCost: 45000,
        notes: 'Test holding'
      });
    });

    it('should convert symbol to uppercase on submit', () => {
      component.holdingForm.patchValue({ symbol: 'btc' });
      spyOn(component.submitHolding, 'emit');
      component.onSubmit();
      expect(component.submitHolding.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ symbol: 'BTC' })
      );
    });

    it('should trim name and notes on submit', () => {
      component.holdingForm.patchValue({
        name: '  Bitcoin  ',
        notes: '  Test  '
      });
      spyOn(component.submitHolding, 'emit');
      component.onSubmit();
      expect(component.submitHolding.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: 'Bitcoin',
          notes: 'Test'
        })
      );
    });

    it('should not submit if form is invalid', () => {
      component.holdingForm.patchValue({ symbol: '' });
      spyOn(component.submitHolding, 'emit');
      component.onSubmit();
      expect(component.submitHolding.emit).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched if form is invalid', () => {
      component.holdingForm.patchValue({ symbol: '' });
      component.onSubmit();
      expect(component.holdingForm.get('symbol')?.touched).toBe(true);
      expect(component.holdingForm.get('name')?.touched).toBe(true);
    });

    it('should set isSubmitting to true when submitting', () => {
      component.onSubmit();
      expect(component.isSubmitting()).toBe(true);
    });

    it('should not submit if already submitting', () => {
      component.isSubmitting.set(true);
      spyOn(component.submitHolding, 'emit');
      component.onSubmit();
      expect(component.submitHolding.emit).not.toHaveBeenCalled();
    });
  });

  describe('Symbol Input Handling', () => {
    it('should convert input to uppercase', () => {
      const event = {
        target: { value: 'btc' }
      } as unknown as Event;

      component.onSymbolInput(event);
      expect(component.holdingForm.get('symbol')?.value).toBe('BTC');
    });
  });

  describe('Error Display', () => {
    it('should return error message for required field', () => {
      const symbol = component.holdingForm.get('symbol');
      symbol?.setValue('');
      symbol?.markAsTouched();
      expect(component.getFieldError('symbol')).toBe('Symbol is required');
    });

    it('should return error message for invalid pattern', () => {
      const symbol = component.holdingForm.get('symbol');
      symbol?.setValue('btc');
      symbol?.markAsTouched();
      expect(component.getFieldError('symbol')).toBe('Symbol must contain only uppercase letters');
    });

    it('should return null if field is untouched', () => {
      const symbol = component.holdingForm.get('symbol');
      symbol?.setValue('');
      expect(component.getFieldError('symbol')).toBe(null);
    });

    it('should return null if field is valid', () => {
      const symbol = component.holdingForm.get('symbol');
      symbol?.setValue('BTC');
      symbol?.markAsTouched();
      expect(component.getFieldError('symbol')).toBe(null);
    });

    it('should correctly identify if field has error', () => {
      const symbol = component.holdingForm.get('symbol');
      symbol?.setValue('');
      symbol?.markAsTouched();
      expect(component.hasFieldError('symbol')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small decimal quantities', () => {
      const quantity = component.holdingForm.get('quantity');
      quantity?.setValue(0.00000001);
      expect(quantity?.valid).toBe(true);
    });

    it('should handle empty notes field', () => {
      component.holdingForm.patchValue({
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1,
        averageCost: 45000,
        notes: ''
      });
      spyOn(component.submitHolding, 'emit');
      component.onSubmit();
      expect(component.submitHolding.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ notes: undefined })
      );
    });

    it('should convert string numbers to numbers', () => {
      component.holdingForm.patchValue({
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: '1.5' as any,
        averageCost: '45000' as any
      });
      spyOn(component.submitHolding, 'emit');
      component.onSubmit();
      expect(component.submitHolding.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          quantity: 1.5,
          averageCost: 45000
        })
      );
    });
  });
});
