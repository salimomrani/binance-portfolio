// T113: Holdings routes with holding detail

import { Routes } from '@angular/router';
import { HoldingsComponent } from './holdings.component';
import { HoldingDetailComponent } from './components/holding-detail/holding-detail.component';

export const HOLDINGS_ROUTES: Routes = [
  {
    path: '',
    component: HoldingsComponent,
  },
  {
    path: 'portfolio/:portfolioId/holding/:holdingId',
    component: HoldingDetailComponent,
    title: 'Holding Details',
  },
];
