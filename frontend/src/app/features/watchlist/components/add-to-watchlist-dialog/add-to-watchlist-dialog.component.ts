// T174: Add to Watchlist Dialog component with symbol search and validation

import {
  Component,
  output,
  input,
  signal,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { AddToWatchlistRequest } from '../../../../shared/models/watchlist.model';
import { selectIsInWatchlist } from '../../store/watchlist.selectors';

// Common cryptocurrency symbols for autocomplete
const COMMON_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'BNB', name: 'Binance Coin' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'UNI', name: 'Uniswap' },
  { symbol: 'ATOM', name: 'Cosmos' },
  { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'NEAR', name: 'NEAR Protocol' },
];

@Component({
  selector: 'app-add-to-watchlist-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-to-watchlist-dialog.component.html',
  styleUrl: './add-to-watchlist-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddToWatchlistDialogComponent implements OnInit {
  // Signal-based inputs
  isOpen = input<boolean>(false);

  // Signal-based outputs
  close = output<void>();
  save = output<AddToWatchlistRequest>();

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  // Internal state
  protected readonly form = signal<FormGroup | null>(null);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly showSuggestions = signal<boolean>(false);
  protected readonly searchQuery = signal<string>('');

  // Filtered crypto suggestions based on search
  protected readonly filteredCryptos = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query || query.length < 1) {
      return COMMON_CRYPTOS;
    }
    return COMMON_CRYPTOS.filter(
      (crypto) =>
        crypto.symbol.toLowerCase().includes(query) ||
        crypto.name.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.form.set(
      this.fb.group({
        symbol: [
          '',
          [
            Validators.required,
            Validators.maxLength(10),
            Validators.pattern(/^[A-Z]+$/),
          ],
        ],
        name: ['', [Validators.required, Validators.maxLength(100)]],
        notes: ['', [Validators.maxLength(500)]],
      })
    );
  }

  /**
   * Close dialog without saving
   */
  onClose(): void {
    this.form()?.reset();
    this.isSubmitting.set(false);
    this.showSuggestions.set(false);
    this.searchQuery.set('');
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

    const formValue = currentForm.value;
    const symbol = formValue.symbol.toUpperCase();

    // Check if already in watchlist
    const isInWatchlist = this.store.selectSignal(selectIsInWatchlist(symbol));
    if (isInWatchlist()) {
      alert(`${symbol} is already in your watchlist`);
      return;
    }

    this.isSubmitting.set(true);

    const request: AddToWatchlistRequest = {
      symbol,
      name: formValue.name.trim(),
      notes: formValue.notes?.trim() || undefined,
    };

    this.save.emit(request);
    currentForm.reset();
    this.isSubmitting.set(false);
    this.showSuggestions.set(false);
    this.searchQuery.set('');
  }

  /**
   * Handle symbol input for autocomplete
   */
  onSymbolInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase();
    const control = this.form()?.get('symbol');

    if (control) {
      control.setValue(value, { emitEvent: false });
    }

    this.searchQuery.set(value);
    this.showSuggestions.set(value.length > 0);
  }

  /**
   * Select crypto from suggestions
   */
  selectCrypto(crypto: { symbol: string; name: string }): void {
    const form = this.form();
    if (!form) return;

    form.patchValue({
      symbol: crypto.symbol,
      name: crypto.name,
    });

    this.searchQuery.set('');
    this.showSuggestions.set(false);
  }

  /**
   * Handle focus on symbol input
   */
  onSymbolFocus(): void {
    const symbol = this.form()?.get('symbol')?.value || '';
    this.searchQuery.set(symbol);
    this.showSuggestions.set(true);
  }

  /**
   * Handle blur on symbol input (with delay to allow click on suggestion)
   */
  onSymbolBlur(): void {
    setTimeout(() => {
      this.showSuggestions.set(false);
    }, 200);
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
      notes: 'Notes',
    };
    return labels[controlName] || controlName;
  }
}
