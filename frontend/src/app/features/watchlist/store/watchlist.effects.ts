// T169: Watchlist effects for API integration

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { WatchlistApiService } from '../services/watchlist-api.service';
import * as WatchlistActions from './watchlist.actions';

@Injectable()
export class WatchlistEffects {
  private readonly actions$ = inject(Actions);
  private readonly watchlistApi = inject(WatchlistApiService);

  /**
   * Effect: Load watchlist
   */
  loadWatchlist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WatchlistActions.loadWatchlist, WatchlistActions.refreshWatchlistPrices),
      switchMap(() =>
        this.watchlistApi.getWatchlist().pipe(
          map((items) =>
            WatchlistActions.loadWatchlistSuccess({ items })
          ),
          catchError((error) =>
            of(
              WatchlistActions.loadWatchlistFailure({
                error: error.message || 'Failed to load watchlist',
              })
            )
          )
        )
      )
    )
  );

  /**
   * Effect: Add to watchlist
   */
  addToWatchlist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WatchlistActions.addToWatchlist),
      switchMap(({ request }) =>
        this.watchlistApi.addToWatchlist(request).pipe(
          map((item) =>
            WatchlistActions.addToWatchlistSuccess({ item })
          ),
          catchError((error) =>
            of(
              WatchlistActions.addToWatchlistFailure({
                error: error.message || 'Failed to add to watchlist',
              })
            )
          )
        )
      )
    )
  );

  /**
   * Effect: Remove from watchlist
   */
  removeFromWatchlist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WatchlistActions.removeFromWatchlist),
      switchMap(({ itemId }) =>
        this.watchlistApi.removeFromWatchlist(itemId).pipe(
          map(() =>
            WatchlistActions.removeFromWatchlistSuccess({ itemId })
          ),
          catchError((error) =>
            of(
              WatchlistActions.removeFromWatchlistFailure({
                error: error.message || 'Failed to remove from watchlist',
              })
            )
          )
        )
      )
    )
  );
}
