// T107: Holdings effects

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { HoldingsApiService } from '../services/holdings-api.service';
import { PortfolioApiService } from '../../portfolio/services/portfolio-api.service';
import * as HoldingsActions from './holdings.actions';

@Injectable()
export class HoldingsEffects {
  private readonly actions$ = inject(Actions);
  private readonly holdingsApi = inject(HoldingsApiService);
  private readonly portfolioApi = inject(PortfolioApiService);

  loadHoldings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HoldingsActions.loadHoldings),
      switchMap(({ portfolioId }) =>
        this.holdingsApi.getHoldings(portfolioId).pipe(
          map(holdings => HoldingsActions.loadHoldingsSuccess({ holdings })),
          catchError(error =>
            of(HoldingsActions.loadHoldingsFailure({ error: error.message || 'Failed to load holdings' }))
          )
        )
      )
    )
  );

  loadHoldingDetails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HoldingsActions.loadHoldingDetails),
      switchMap(({ portfolioId, holdingId }) =>
        this.holdingsApi.getHoldingById(portfolioId, holdingId).pipe(
          map(holding => HoldingsActions.loadHoldingDetailsSuccess({ holding })),
          catchError(error =>
            of(HoldingsActions.loadHoldingDetailsFailure({ error: error.message || 'Failed to load holding details' }))
          )
        )
      )
    )
  );

  loadTransactions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HoldingsActions.loadTransactions),
      switchMap(({ holdingId }) =>
        this.holdingsApi.getTransactions(holdingId).pipe(
          map(transactions => HoldingsActions.loadTransactionsSuccess({ transactions })),
          catchError(error =>
            of(HoldingsActions.loadTransactionsFailure({ error: error.message || 'Failed to load transactions' }))
          )
        )
      )
    )
  );

  addTransaction$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HoldingsActions.addTransaction),
      switchMap(({ holdingId, transaction }) =>
        this.holdingsApi.addTransaction(holdingId, transaction).pipe(
          map(({ transaction: newTransaction, updatedHolding }) =>
            HoldingsActions.addTransactionSuccess({ transaction: newTransaction, updatedHolding })
          ),
          catchError(error =>
            of(HoldingsActions.addTransactionFailure({ error: error.message || 'Failed to add transaction' }))
          )
        )
      )
    )
  );

  updateHolding$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HoldingsActions.updateHolding),
      switchMap(({ portfolioId, holdingId, quantity, averageCost, notes }) =>
        this.portfolioApi.updateHolding(portfolioId, holdingId, { quantity, averageCost, notes }).pipe(
          map(holding => HoldingsActions.updateHoldingSuccess({ holding })),
          catchError(error =>
            of(HoldingsActions.updateHoldingFailure({ error: error.message || 'Failed to update holding' }))
          )
        )
      )
    )
  );

  deleteHolding$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HoldingsActions.deleteHolding),
      switchMap(({ portfolioId, holdingId }) =>
        this.portfolioApi.deleteHolding(portfolioId, holdingId).pipe(
          map(() => HoldingsActions.deleteHoldingSuccess({ holdingId })),
          catchError(error =>
            of(HoldingsActions.deleteHoldingFailure({ error: error.message || 'Failed to delete holding' }))
          )
        )
      )
    )
  );
}
