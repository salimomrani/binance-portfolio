// T079-T081: Portfolio dashboard component with signals for reactive state
// T156: Integrated price-update service for real-time price polling

import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PortfolioFacadeService } from '../../services/portfolio-facade.service';
import { PortfolioApiService } from '../../services/portfolio-api.service';
import { Portfolio, AddHoldingRequest } from '../../../../shared/models/portfolio.model';
import { PortfolioSummaryComponent } from '../portfolio-summary/portfolio-summary.component';
import { PortfolioTableComponent } from '../portfolio-table/portfolio-table.component';
import { AddHoldingDialogComponent } from '../../../holdings/components/add-holding-dialog/add-holding-dialog.component';
import { PriceUpdateService } from '../../../../core/services/price-update.service';

@Component({
  selector: 'app-portfolio-dashboard',
  standalone: true,
  imports: [CommonModule, PortfolioSummaryComponent, PortfolioTableComponent, AddHoldingDialogComponent],
  templateUrl: './portfolio-dashboard.component.html',
  styleUrl: './portfolio-dashboard.component.scss',
})
export class PortfolioDashboardComponent implements OnInit, OnDestroy {
  private readonly portfolioFacade = inject(PortfolioFacadeService);
  private readonly portfolioApi = inject(PortfolioApiService);
  private readonly router = inject(Router);
  private readonly priceUpdateService = inject(PriceUpdateService);

  // Signals for reactive state
  protected readonly portfolios = signal<Portfolio[]>([]);
  protected readonly selectedPortfolio = signal<Portfolio | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly lastUpdated = signal<Date | null>(null);
  protected readonly isAddHoldingDialogOpen = signal<boolean>(false);

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

  constructor() {
    // Effect to start/stop price updates when portfolio symbols change
    effect(() => {
      const symbols = this.portfolioSymbols();
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

  ngOnDestroy(): void {
    // Stop price updates when component is destroyed
    this.priceUpdateService.stopPriceUpdates();
  }
}
