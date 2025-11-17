// T049: Angular routing with lazy loading for features

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/portfolio',
    pathMatch: 'full'
  },
  {
    path: 'portfolio',
    loadChildren: () => import('./features/portfolio/portfolio.routes').then(m => m.PORTFOLIO_ROUTES)
  },
  {
    path: 'holdings',
    loadChildren: () => import('./features/holdings/holdings.routes').then(m => m.HOLDINGS_ROUTES)
  },
  {
    path: 'watchlist',
    loadChildren: () => import('./features/watchlist/watchlist.routes').then(m => m.WATCHLIST_ROUTES)
  },
  {
    path: 'market',
    loadChildren: () => import('./features/market-trends/market-trends.routes').then(m => m.MARKET_TRENDS_ROUTES)
  },
  {
    path: '**',
    redirectTo: '/portfolio'
  }
];
