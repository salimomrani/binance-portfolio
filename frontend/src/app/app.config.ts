import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { portfolioReducer } from './features/portfolio/store/portfolio.reducer';
import { PortfolioEffects } from './features/portfolio/store/portfolio.effects';
import { watchlistReducer } from './features/watchlist/store/watchlist.reducer';
import { WatchlistEffects } from './features/watchlist/store/watchlist.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideStore({
      portfolio: portfolioReducer,
      watchlist: watchlistReducer
    }),
    provideEffects([PortfolioEffects, WatchlistEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      connectInZone: true
    })
  ]
};
