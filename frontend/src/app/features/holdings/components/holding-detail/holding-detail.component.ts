// T112: Holding detail component

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { Holding } from '../../../../shared/models/portfolio.model';
import { Transaction } from '../../../../shared/models/holding.model';
import { GainLossBadgeComponent } from '../../../../shared/components/gain-loss-badge/gain-loss-badge.component';
import * as HoldingsActions from '../../store/holdings.actions';
import * as HoldingsSelectors from '../../store/holdings.selectors';

@Component({
  selector: 'app-holding-detail',
  standalone: true,
  imports: [CommonModule, GainLossBadgeComponent],
  templateUrl: './holding-detail.component.html',
  styleUrl: './holding-detail.component.scss',
})
export class HoldingDetailComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  protected readonly holding = signal<Holding | null>(null);
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly isEmpty = computed(() => this.transactions().length === 0);

  ngOnInit(): void {
    // Get route parameters
    const portfolioId = this.route.snapshot.paramMap.get('portfolioId');
    const holdingId = this.route.snapshot.paramMap.get('holdingId');

    if (!portfolioId || !holdingId) {
      this.error.set('Invalid route parameters');
      return;
    }

    // Load holding details
    this.store.dispatch(HoldingsActions.loadHoldingDetails({ portfolioId, holdingId }));
    this.store.dispatch(HoldingsActions.loadTransactions({ holdingId }));

    // Subscribe to holding details
    this.store
      .select(HoldingsSelectors.selectSelectedHolding)
      .pipe(takeUntil(this.destroy$))
      .subscribe((holding) => {
        this.holding.set(holding);
      });

    // Subscribe to transactions
    this.store
      .select(HoldingsSelectors.selectTransactionsSortedByDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe((transactions) => {
        this.transactions.set(transactions);
      });

    // Subscribe to loading state
    this.store
      .select(HoldingsSelectors.selectHoldingsLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        this.loading.set(loading);
      });

    // Subscribe to error state
    this.store
      .select(HoldingsSelectors.selectHoldingsError)
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        this.error.set(error);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.dispatch(HoldingsActions.clearSelectedHolding());
  }

  onAddTransaction(): void {
    // TODO: Open add transaction dialog (T114)
    console.log('Add transaction clicked');
  }

  onBack(): void {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(value);
  }

  formatQuantity(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
