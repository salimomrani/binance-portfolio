// Aggregate holdings view across all portfolios
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PortfolioFacadeService } from '../portfolio/services/portfolio-facade.service';
import { PortfolioTableComponent } from '../portfolio/components/portfolio-table/portfolio-table.component';
import { Holding } from '../../shared/models/portfolio.model';

@Component({
  selector: 'app-holdings',
  standalone: true,
  imports: [CommonModule, RouterLink, PortfolioTableComponent],
  templateUrl: './holdings.component.html',
  styleUrl: './holdings.component.scss',
})
export class HoldingsComponent implements OnInit {
  private readonly portfolioFacade = inject(PortfolioFacadeService);

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly portfolios = signal<any[]>([]);

  // Computed aggregated holdings
  protected readonly aggregatedHoldings = computed(() => {
    const portfolios = this.portfolios();
    if (portfolios.length === 0) return [];

    // Map to store aggregated holdings by symbol
    const holdingsMap = new Map<string, {
      symbol: string;
      name: string;
      totalQuantity: number;
      totalCostBasis: number;
      currentPrice: number;
      currentValue: number;
      gainLoss: number;
      gainLossPercentage: number;
      priceChange24h: number;
      volume24h: number;
      marketCap: number;
      notes: string[];
      portfolioCount: number;
    }>();

    // Aggregate holdings across all portfolios
    portfolios.forEach(portfolio => {
      if (!portfolio.holdings) return;

      portfolio.holdings.forEach((holding: Holding) => {
        const existing = holdingsMap.get(holding.symbol);

        if (existing) {
          // Combine with existing holding
          const newTotalQuantity = existing.totalQuantity + holding.quantity;
          const newTotalCostBasis = existing.totalCostBasis + holding.costBasis;
          const newCurrentValue = existing.currentValue + holding.currentValue;
          const newGainLoss = existing.gainLoss + holding.gainLoss;

          existing.totalQuantity = newTotalQuantity;
          existing.totalCostBasis = newTotalCostBasis;
          existing.currentValue = newCurrentValue;
          existing.gainLoss = newGainLoss;
          existing.gainLossPercentage = newTotalCostBasis > 0
            ? (newGainLoss / newTotalCostBasis) * 100
            : 0;
          existing.portfolioCount++;

          // Keep the latest market data
          existing.currentPrice = holding.currentPrice;
          existing.priceChange24h = holding.priceChange24h;
          existing.volume24h = holding.volume24h;
          existing.marketCap = holding.marketCap;

          // Collect notes
          if (holding.notes && !existing.notes.includes(holding.notes)) {
            existing.notes.push(holding.notes);
          }
        } else {
          // Add new holding
          holdingsMap.set(holding.symbol, {
            symbol: holding.symbol,
            name: holding.name,
            totalQuantity: holding.quantity,
            totalCostBasis: holding.costBasis,
            currentPrice: holding.currentPrice,
            currentValue: holding.currentValue,
            gainLoss: holding.gainLoss,
            gainLossPercentage: holding.gainLossPercentage,
            priceChange24h: holding.priceChange24h,
            volume24h: holding.volume24h,
            marketCap: holding.marketCap,
            notes: holding.notes ? [holding.notes] : [],
            portfolioCount: 1,
          });
        }
      });
    });

    // Convert map to array and calculate allocations
    const holdings = Array.from(holdingsMap.values());
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);

    // Map to Holding interface format
    return holdings.map((h, index) => ({
      id: `aggregated-${h.symbol}`, // Synthetic ID for aggregated holdings
      symbol: h.symbol,
      name: h.name,
      quantity: h.totalQuantity,
      averageCost: h.totalCostBasis / h.totalQuantity, // Weighted average
      currentPrice: h.currentPrice,
      currentValue: h.currentValue,
      costBasis: h.totalCostBasis,
      gainLoss: h.gainLoss,
      gainLossPercentage: h.gainLossPercentage,
      allocationPercentage: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0,
      priceChange24h: h.priceChange24h,
      volume24h: h.volume24h,
      marketCap: h.marketCap,
      notes: h.portfolioCount > 1
        ? `Across ${h.portfolioCount} portfolios`
        : h.notes.length > 0 ? h.notes[0] : null,
      lastUpdated: new Date(),
    } as Holding));
  });

  protected readonly isEmpty = computed(() => this.aggregatedHoldings().length === 0);
  protected readonly totalValue = computed(() =>
    this.aggregatedHoldings().reduce((sum, h) => sum + h.currentValue, 0)
  );
  protected readonly totalGainLoss = computed(() =>
    this.aggregatedHoldings().reduce((sum, h) => sum + h.gainLoss, 0)
  );
  protected readonly totalGainLossPercentage = computed(() => {
    const totalCostBasis = this.aggregatedHoldings().reduce((sum, h) => sum + h.costBasis, 0);
    return totalCostBasis > 0 ? (this.totalGainLoss() / totalCostBasis) * 100 : 0;
  });

  ngOnInit(): void {
    this.loadAllPortfolios();

    // Subscribe to portfolios from store
    this.portfolioFacade.portfolios$.subscribe(portfolios => {
      this.portfolios.set(portfolios);
    });

    // Subscribe to loading state
    this.portfolioFacade.loading$.subscribe(loading => {
      this.loading.set(loading);
    });

    // Subscribe to error state
    this.portfolioFacade.error$.subscribe(error => {
      this.error.set(error);
    });
  }

  /**
   * Load all portfolios with their holdings
   */
  private loadAllPortfolios(): void {
    this.portfolioFacade.loadPortfolios();
  }

  /**
   * Refresh data
   */
  onRefresh(): void {
    this.loadAllPortfolios();
  }

  /**
   * Clear error
   */
  onClearError(): void {
    this.portfolioFacade.clearError();
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'always',
    }).format(value / 100);
  }
}
