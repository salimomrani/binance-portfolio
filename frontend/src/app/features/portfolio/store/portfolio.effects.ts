// T076: Portfolio effects for API integration

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { PortfolioApiService } from '../services/portfolio-api.service';
import * as PortfolioActions from './portfolio.actions';

@Injectable()
export class PortfolioEffects {
  private readonly actions$ = inject(Actions);
  private readonly portfolioApi = inject(PortfolioApiService);

  /**
   * Effect: Load all portfolios
   */
  loadPortfolios$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.loadPortfolios),
      switchMap(() =>
        this.portfolioApi.getPortfolios().pipe(
          map(portfolios =>
            PortfolioActions.loadPortfoliosSuccess({ portfolios })
          ),
          catchError(error =>
            of(
              PortfolioActions.loadPortfoliosFailure({
                error: error.message || 'Failed to load portfolios',
              })
            )
          )
        )
      )
    )
  );

  /**
   * Effect: Load portfolio details
   */
  loadPortfolioDetails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.loadPortfolioDetails),
      switchMap(({ portfolioId }) =>
        this.portfolioApi.getPortfolioById(portfolioId).pipe(
          map(portfolio =>
            PortfolioActions.loadPortfolioDetailsSuccess({ portfolio })
          ),
          catchError(error =>
            of(
              PortfolioActions.loadPortfolioDetailsFailure({
                error: error.message || 'Failed to load portfolio details',
              })
            )
          )
        )
      )
    )
  );

  /**
   * Effect: Create portfolio
   */
  createPortfolio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.createPortfolio),
      switchMap(({ request }) =>
        this.portfolioApi.createPortfolio(request).pipe(
          map(portfolio =>
            PortfolioActions.createPortfolioSuccess({ portfolio })
          ),
          catchError(error =>
            of(
              PortfolioActions.createPortfolioFailure({
                error: error.message || 'Failed to create portfolio',
              })
            )
          )
        )
      )
    )
  );

  /**
   * Effect: Auto-load portfolio details after creation
   */
  createPortfolioSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.createPortfolioSuccess),
      map(({ portfolio }) =>
        PortfolioActions.loadPortfolioDetails({ portfolioId: portfolio.id })
      )
    )
  );

  /**
   * Effect: Update portfolio
   */
  updatePortfolio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.updatePortfolio),
      switchMap(({ portfolioId, request }) =>
        this.portfolioApi.updatePortfolio(portfolioId, request).pipe(
          map(portfolio =>
            PortfolioActions.updatePortfolioSuccess({ portfolio })
          ),
          catchError(error =>
            of(
              PortfolioActions.updatePortfolioFailure({
                error: error.message || 'Failed to update portfolio',
              })
            )
          )
        )
      )
    )
  );

  /**
   * Effect: Delete portfolio
   */
  deletePortfolio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.deletePortfolio),
      switchMap(({ portfolioId }) =>
        this.portfolioApi.deletePortfolio(portfolioId).pipe(
          map(() =>
            PortfolioActions.deletePortfolioSuccess({ portfolioId })
          ),
          catchError(error =>
            of(
              PortfolioActions.deletePortfolioFailure({
                error: error.message || 'Failed to delete portfolio',
              })
            )
          )
        )
      )
    )
  );

  /**
   * Effect: Reload portfolios after deletion
   */
  deletePortfolioSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.deletePortfolioSuccess),
      map(() => PortfolioActions.loadPortfolios())
    )
  );

  /**
   * Effect: Auto-select portfolio
   */
  selectPortfolio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.selectPortfolio),
      map(({ portfolioId }) =>
        PortfolioActions.loadPortfolioDetails({ portfolioId })
      )
    )
  );

  /**
   * Effect: Add holding
   */
  addHolding$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.addHolding),
      switchMap(({ portfolioId, request }) =>
        this.portfolioApi.addHolding(portfolioId, request).pipe(
          map(holding =>
            PortfolioActions.addHoldingSuccess({ holding })
          ),
          catchError(error =>
            of(
              PortfolioActions.addHoldingFailure({
                error: error.message || 'Failed to add holding',
              })
            )
          )
        )
      )
    )
  );

  /**
   * Effect: Reload portfolio after adding holding
   */
  addHoldingSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.addHoldingSuccess),
      switchMap(() => {
        // Get the current selected portfolio ID from the store
        // For now, we'll trigger a reload of all portfolios
        return of(PortfolioActions.loadPortfolios());
      })
    )
  );

  /**
   * Effect: Update holding
   */
  updateHolding$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.updateHolding),
      switchMap(({ portfolioId, holdingId, request }) =>
        this.portfolioApi.updateHolding(portfolioId, holdingId, request).pipe(
          map(holding =>
            PortfolioActions.updateHoldingSuccess({ holding })
          ),
          catchError(error =>
            of(
              PortfolioActions.updateHoldingFailure({
                error: error.message || 'Failed to update holding',
              })
            )
          )
        )
      )
    )
  );

  /**
   * Effect: Delete holding
   */
  deleteHolding$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.deleteHolding),
      switchMap(({ portfolioId, holdingId }) =>
        this.portfolioApi.deleteHolding(portfolioId, holdingId).pipe(
          map(() =>
            PortfolioActions.deleteHoldingSuccess({ portfolioId, holdingId })
          ),
          catchError(error =>
            of(
              PortfolioActions.deleteHoldingFailure({
                error: error.message || 'Failed to delete holding',
              })
            )
          )
        )
      )
    )
  );

  /**
   * Effect: Reload portfolio after deleting holding
   */
  deleteHoldingSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.deleteHoldingSuccess),
      map(({ portfolioId }) =>
        PortfolioActions.loadPortfolioDetails({ portfolioId })
      )
    )
  );
}
