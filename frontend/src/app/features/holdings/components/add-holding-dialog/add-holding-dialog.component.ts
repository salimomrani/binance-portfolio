// T087: Add Holding Dialog component with signal-based inputs

import { Component, output, input, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AddHoldingRequest } from '../../../../shared/models/portfolio.model';

@Component({
  selector: 'app-add-holding-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-holding-dialog.component.html',
  styleUrl: './add-holding-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddHoldingDialogComponent implements OnInit {
  // Signal-based inputs
  isOpen = input<boolean>(false);

  // Signal-based outputs
  close = output<void>();
  save = output<AddHoldingRequest>();

  // Internal state
  protected readonly form = signal<FormGroup | null>(null);
  protected readonly isSubmitting = signal<boolean>(false);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form.set(
      this.fb.group({
        symbol: ['', [
          Validators.required,
          Validators.maxLength(10),
          Validators.pattern(/^[A-Z]+$/),
        ]],
        name: ['', [
          Validators.required,
          Validators.maxLength(100),
        ]],
        quantity: [null, [
          Validators.required,
          Validators.min(0.00000001),
          Validators.max(1000000000),
        ]],
        averageCost: [null, [
          Validators.required,
          Validators.min(0.00000001),
          Validators.max(10000000),
        ]],
        notes: ['', [
          Validators.maxLength(1000),
        ]],
      })
    );
  }

  /**
   * Close dialog without saving
   */
  onClose(): void {
    this.form()?.reset();
    this.isSubmitting.set(false);
    this.close.emit();
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    const currentForm = this.form();
    if (!currentForm || currentForm.invalid) {
      // Mark all fields as touched to show validation errors
      currentForm?.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = currentForm.value;
    const request: AddHoldingRequest = {
      symbol: formValue.symbol.toUpperCase(),
      name: formValue.name.trim(),
      quantity: Number(formValue.quantity),
      averageCost: Number(formValue.averageCost),
      notes: formValue.notes?.trim() || undefined,
    };

    this.save.emit(request);
    currentForm.reset();
    this.isSubmitting.set(false);
  }

  /**
   * Get form control error message
   */
  getErrorMessage(controlName: string): string {
    const control = this.form()?.get(controlName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;
    if (errors['required']) {
      return `${this.getFieldLabel(controlName)} is required`;
    }
    if (errors['maxLength']) {
      return `${this.getFieldLabel(controlName)} is too long`;
    }
    if (errors['pattern']) {
      return 'Symbol must contain only uppercase letters';
    }
    if (errors['min']) {
      return `${this.getFieldLabel(controlName)} must be positive`;
    }
    if (errors['max']) {
      return `${this.getFieldLabel(controlName)} exceeds maximum value`;
    }

    return 'Invalid value';
  }

  /**
   * Check if form control has error
   */
  hasError(controlName: string): boolean {
    const control = this.form()?.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Get field label for error messages
   */
  private getFieldLabel(controlName: string): string {
    const labels: Record<string, string> = {
      symbol: 'Symbol',
      name: 'Name',
      quantity: 'Quantity',
      averageCost: 'Average Cost',
      notes: 'Notes',
    };
    return labels[controlName] || controlName;
  }

  /**
   * Auto-uppercase symbol field
   */
  onSymbolInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.form()?.get('symbol');
    if (control) {
      control.setValue(input.value.toUpperCase(), { emitEvent: false });
    }
  }
}
