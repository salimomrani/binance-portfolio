// T087: Add holding dialog component

import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddHoldingRequest } from '../../../../shared/models/portfolio.model';

@Component({
  selector: 'app-add-holding-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-holding-dialog.component.html',
  styleUrl: './add-holding-dialog.component.scss'
})
export class AddHoldingDialogComponent {
  @Output() closeDialog = new EventEmitter<void>();
  @Output() submitHolding = new EventEmitter<AddHoldingRequest>();

  isOpen = signal(false);
  holdingForm: FormGroup;
  isSubmitting = signal(false);

  constructor(private fb: FormBuilder) {
    this.holdingForm = this.fb.group({
      symbol: ['', [
        Validators.required,
        Validators.maxLength(10),
        Validators.pattern(/^[A-Z]+$/)
      ]],
      name: ['', [
        Validators.required,
        Validators.maxLength(100)
      ]],
      quantity: [null, [
        Validators.required,
        Validators.min(0.00000001),
        Validators.max(1000000000)
      ]],
      averageCost: [null, [
        Validators.required,
        Validators.min(0.00000001),
        Validators.max(10000000)
      ]],
      notes: ['', [Validators.maxLength(1000)]]
    });
  }

  open(): void {
    this.isOpen.set(true);
    this.holdingForm.reset();
    this.isSubmitting.set(false);
  }

  close(): void {
    this.isOpen.set(false);
    this.holdingForm.reset();
    this.closeDialog.emit();
  }

  onSubmit(): void {
    if (this.holdingForm.invalid || this.isSubmitting()) {
      this.holdingForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.holdingForm.value;
    const holdingData: AddHoldingRequest = {
      symbol: formValue.symbol.toUpperCase(),
      name: formValue.name.trim(),
      quantity: Number(formValue.quantity),
      averageCost: Number(formValue.averageCost),
      notes: formValue.notes?.trim() || undefined
    };

    this.submitHolding.emit(holdingData);
  }

  onSymbolInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase();
    this.holdingForm.patchValue({ symbol: value }, { emitEvent: false });
  }

  getFieldError(fieldName: string): string | null {
    const control = this.holdingForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    const errors = control.errors;
    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['maxLength']) return `${this.getFieldLabel(fieldName)} is too long`;
    if (errors['pattern']) return 'Symbol must contain only uppercase letters';
    if (errors['min']) return `${this.getFieldLabel(fieldName)} must be positive`;
    if (errors['max']) return `${this.getFieldLabel(fieldName)} exceeds maximum value`;

    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      symbol: 'Symbol',
      name: 'Name',
      quantity: 'Quantity',
      averageCost: 'Average Cost',
      notes: 'Notes'
    };
    return labels[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    return this.getFieldError(fieldName) !== null;
  }
}
