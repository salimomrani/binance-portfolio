// T149: Market trends routes with crypto detail page
import { Routes } from '@angular/router';
import { MarketTrendsComponent } from './market-trends.component';
import { CryptoDetailComponent } from './components/crypto-detail/crypto-detail.component';

export const MARKET_TRENDS_ROUTES: Routes = [
  {
    path: '',
    component: MarketTrendsComponent,
  },
  {
    path: ':symbol',
    component: CryptoDetailComponent,
  },
];
