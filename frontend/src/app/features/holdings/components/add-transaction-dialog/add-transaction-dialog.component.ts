// T114: Add Transaction Dialog Component

import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddTransactionRequest } from '../../../../shared/models/holding.model';

@Component({
  selector: 'app-add-transaction-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-transaction-dialog.component.html',
  styleUrl: './add-transaction-dialog.component.scss',
})
export class AddTransactionDialogComponent {
  private readonly fb = inject(FormBuilder);

  @Output() submit = new EventEmitter<AddTransactionRequest>();
  @Output() cancel = new EventEmitter<void>();

  protected readonly transactionForm = this.fb.group({
    type: ['BUY', Validators.required],
    quantity: [0, [Validators.required, Validators.min(0.00000001)]],
    pricePerUnit: [0, [Validators.required, Validators.min(0)]],
    fee: [0, [Validators.min(0)]],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    notes: [''],
  });

  protected get totalCost(): number {
    const quantity = this.transactionForm.get('quantity')?.value || 0;
    const pricePerUnit = this.transactionForm.get('pricePerUnit')?.value || 0;
    const fee = this.transactionForm.get('fee')?.value || 0;
    return quantity * pricePerUnit + fee;
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      const transaction: AddTransactionRequest = {
        type: formValue.type as 'BUY' | 'SELL',
        quantity: formValue.quantity!,
        pricePerUnit: formValue.pricePerUnit!,
        fee: formValue.fee || undefined,
        date: new Date(formValue.date!),
        notes: formValue.notes || undefined,
      };
      this.submit.emit(transaction);
      this.transactionForm.reset({ type: 'BUY', date: new Date().toISOString().split('T')[0] });
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.transactionForm.reset({ type: 'BUY', date: new Date().toISOString().split('T')[0] });
  }
}
