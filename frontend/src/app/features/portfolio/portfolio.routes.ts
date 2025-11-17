// T088: Portfolio feature routes

import { Routes } from '@angular/router';

export const PORTFOLIO_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/portfolio-dashboard/portfolio-dashboard.component').then(
        m => m.PortfolioDashboardComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/portfolio-dashboard/portfolio-dashboard.component').then(
        m => m.PortfolioDashboardComponent
      ),
  },
];
