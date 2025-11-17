import { Component } from '@angular/core';
import { MarketOverviewComponent } from './components/market-overview/market-overview.component';

@Component({
  selector: 'app-market-trends',
  standalone: true,
  imports: [MarketOverviewComponent],
  templateUrl: './market-trends.component.html',
  styleUrl: './market-trends.component.scss',
})
export class MarketTrendsComponent {}
