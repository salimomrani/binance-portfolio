// T138: Market trends effects

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { MarketDataApiService } from '../services/market-data-api.service';
import * as MarketTrendsActions from './market-trends.actions';

@Injectable()
export class MarketTrendsEffects {
  private readonly actions$ = inject(Actions);
  private readonly marketDataApi = inject(MarketDataApiService);

  loadHistoricalPrices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MarketTrendsActions.loadHistoricalPrices),
      switchMap(({ symbol, timeframe }) =>
        this.marketDataApi.getHistoricalPrices(symbol, timeframe).pipe(
          map((data) =>
            MarketTrendsActions.loadHistoricalPricesSuccess({ symbol, timeframe, data })
          ),
          catchError((error) =>
            of(
              MarketTrendsActions.loadHistoricalPricesFailure({
                error: error.message || 'Failed to load historical prices',
              })
            )
          )
        )
      )
    )
  );
}
