// T079-T081: Portfolio dashboard component with signals for reactive state
// T156: Integrated price-update service for real-time price polling
// T176: Added Holdings/Watchlist tabs

import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { PortfolioFacadeService } from '../../services/portfolio-facade.service';
import { PortfolioApiService } from '../../services/portfolio-api.service';
import { Portfolio, AddHoldingRequest } from '../../../../shared/models/portfolio.model';
import { AddToWatchlistRequest } from '../../../../shared/models/watchlist.model';
import { PortfolioSummaryComponent } from '../portfolio-summary/portfolio-summary.component';
import { PortfolioTableComponent } from '../portfolio-table/portfolio-table.component';
import { AddHoldingDialogComponent } from '../../../holdings/components/add-holding-dialog/add-holding-dialog.component';
import { WatchlistPanelComponent } from '../../../watchlist/components/watchlist-panel/watchlist-panel.component';
import { AddToWatchlistDialogComponent } from '../../../watchlist/components/add-to-watchlist-dialog/add-to-watchlist-dialog.component';
import { PriceUpdateService } from '../../../../core/services/price-update.service';
import { WatchlistActions } from '../../../watchlist/store/watchlist.actions';
import {
  selectWatchlistCount,
  selectAllWatchlistItems,
} from '../../../watchlist/store/watchlist.selectors';

type ViewTab = 'holdings' | 'watchlist';

@Component({
  selector: 'app-portfolio-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    PortfolioSummaryComponent,
    PortfolioTableComponent,
    AddHoldingDialogComponent,
    WatchlistPanelComponent,
    AddToWatchlistDialogComponent,
  ],
  templateUrl: './portfolio-dashboard.component.html',
  styleUrl: './portfolio-dashboard.component.scss',
})
export class PortfolioDashboardComponent implements OnInit, OnDestroy {
  private readonly portfolioFacade = inject(PortfolioFacadeService);
  private readonly portfolioApi = inject(PortfolioApiService);
  private readonly router = inject(Router);
  private readonly priceUpdateService = inject(PriceUpdateService);
  private readonly store = inject(Store);

  // Signals for reactive state
  protected readonly portfolios = signal<Portfolio[]>([]);
  protected readonly selectedPortfolio = signal<Portfolio | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly lastUpdated = signal<Date | null>(null);
  protected readonly isAddHoldingDialogOpen = signal<boolean>(false);

  // T176: Watchlist state
  protected readonly activeTab = signal<ViewTab>('holdings');
  protected readonly isAddToWatchlistDialogOpen = signal<boolean>(false);
  protected readonly watchlistCount = this.store.selectSignal(selectWatchlistCount);

  // T177: Watchlist items for price polling
  private readonly watchlistItems = this.store.selectSignal(selectAllWatchlistItems);

  // Computed signals
  protected readonly hasPortfolios = computed(() => this.portfolios().length > 0);
  protected readonly isEmpty = computed(() => {
    const portfolio = this.selectedPortfolio();
    return !portfolio || (portfolio.holdings && portfolio.holdings.length === 0);
  });

  // Extract symbols from current portfolio for price updates
  private readonly portfolioSymbols = computed(() => {
    const portfolio = this.selectedPortfolio();
    if (!portfolio || !portfolio.holdings) return [];
    return portfolio.holdings.map(h => h.symbol);
  });

  // T177: Extract symbols from watchlist for price updates
  private readonly watchlistSymbols = computed(() => {
    const items = this.watchlistItems();
    return items.map(item => item.symbol);
  });

  // T177: Combine portfolio and watchlist symbols (unique values only)
  private readonly allSymbols = computed(() => {
    const portfolio = this.portfolioSymbols();
    const watchlist = this.watchlistSymbols();
    const combined = [...portfolio, ...watchlist];
    // Return unique symbols
    return Array.from(new Set(combined));
  });

  constructor() {
    // T177: Effect to start/stop price updates when any symbols change
    effect(() => {
      const symbols = this.allSymbols();
      if (symbols.length > 0) {
        this.priceUpdateService.stopPriceUpdates();
        this.priceUpdateService.startPriceUpdates(symbols);
      }
    });

    // Effect to sync lastUpdated from price update service
    effect(() => {
      const priceLastUpdate = this.priceUpdateService.lastUpdate();
      if (priceLastUpdate) {
        this.lastUpdated.set(priceLastUpdate);
      }
    });
  }

  ngOnInit(): void {
    // Sync from Binance first, then load portfolios
    this.syncFromBinanceAndLoad();

    // Subscribe to portfolio facade observables
    this.portfolioFacade.portfolios$.subscribe(portfolios => {
      this.portfolios.set(portfolios);
    });

    this.portfolioFacade.selectedPortfolio$.subscribe(portfolio => {
      this.selectedPortfolio.set(portfolio);
    });

    this.portfolioFacade.loading$.subscribe(loading => {
      this.loading.set(loading);
    });

    this.portfolioFacade.error$.subscribe(error => {
      this.error.set(error);
    });

    this.portfolioFacade.lastUpdated$.subscribe(lastUpdated => {
      this.lastUpdated.set(lastUpdated);
    });
  }

  /**
   * Sync portfolio from Binance and then load all portfolios
   * Silently fails if Binance API keys are not configured
   */
  private syncFromBinanceAndLoad(): void {
    this.loading.set(true);

    this.portfolioApi.syncFromBinance().subscribe({
      next: (result) => {
        console.log('Successfully synced from Binance:', result);
        // Load all portfolios after sync
        this.portfolioFacade.loadPortfolios();
      },
      error: (error) => {
        console.warn('Failed to sync from Binance (API keys may not be configured):', error);
        // Still load portfolios even if sync fails
        this.portfolioFacade.loadPortfolios();
      }
    });
  }

  /**
   * Handle portfolio selection
   */
  onPortfolioSelect(portfolioId: string): void {
    this.portfolioFacade.selectPortfolio(portfolioId);
  }

  /**
   * Navigate to create portfolio
   */
  onCreatePortfolio(): void {
    this.router.navigate(['/portfolio/create']);
  }

  /**
   * Clear error state
   */
  onClearError(): void {
    this.portfolioFacade.clearError();
  }

  /**
   * Refresh portfolio data
   */
  onRefresh(): void {
    const selectedId = this.selectedPortfolio()?.id;
    if (selectedId) {
      this.portfolioFacade.loadPortfolioDetails(selectedId);
    } else {
      this.portfolioFacade.loadPortfolios();
    }
  }

  /**
   * Open add holding dialog
   */
  onOpenAddHoldingDialog(): void {
    this.isAddHoldingDialogOpen.set(true);
  }

  /**
   * Close add holding dialog
   */
  onCloseAddHoldingDialog(): void {
    this.isAddHoldingDialogOpen.set(false);
  }

  /**
   * Handle adding a holding
   */
  onAddHolding(request: AddHoldingRequest): void {
    const portfolioId = this.selectedPortfolio()?.id;
    if (!portfolioId) {
      return;
    }

    this.portfolioFacade.addHolding(portfolioId, request);
    this.isAddHoldingDialogOpen.set(false);
  }

  // T176: Watchlist methods

  /**
   * Switch active tab
   */
  onTabChange(tab: ViewTab): void {
    this.activeTab.set(tab);
  }

  /**
   * Open add to watchlist dialog
   */
  onOpenAddToWatchlistDialog(): void {
    this.isAddToWatchlistDialogOpen.set(true);
  }

  /**
   * Close add to watchlist dialog
   */
  onCloseAddToWatchlistDialog(): void {
    this.isAddToWatchlistDialogOpen.set(false);
  }

  /**
   * Handle adding to watchlist
   */
  onAddToWatchlist(request: AddToWatchlistRequest): void {
    this.store.dispatch(WatchlistActions.addToWatchlist({ request }));
    this.isAddToWatchlistDialogOpen.set(false);
  }

  ngOnDestroy(): void {
    // Stop price updates when component is destroyed
    this.priceUpdateService.stopPriceUpdates();
  }
}
