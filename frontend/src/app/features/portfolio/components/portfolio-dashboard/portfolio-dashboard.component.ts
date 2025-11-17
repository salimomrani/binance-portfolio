// T079-T081: Portfolio dashboard component with signals for reactive state

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PortfolioFacadeService } from '../../services/portfolio-facade.service';
import { Portfolio } from '../../../../shared/models/portfolio.model';
import { PortfolioSummaryComponent } from '../portfolio-summary/portfolio-summary.component';
import { PortfolioTableComponent } from '../portfolio-table/portfolio-table.component';

@Component({
  selector: 'app-portfolio-dashboard',
  standalone: true,
  imports: [CommonModule, PortfolioSummaryComponent, PortfolioTableComponent],
  templateUrl: './portfolio-dashboard.component.html',
  styleUrl: './portfolio-dashboard.component.scss',
})
export class PortfolioDashboardComponent implements OnInit {
  private readonly portfolioFacade = inject(PortfolioFacadeService);
  private readonly router = inject(Router);

  // Signals for reactive state
  protected readonly portfolios = signal<Portfolio[]>([]);
  protected readonly selectedPortfolio = signal<Portfolio | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly lastUpdated = signal<Date | null>(null);

  // Computed signals
  protected readonly hasPortfolios = computed(() => this.portfolios().length > 0);
  protected readonly isEmpty = computed(() => {
    const portfolio = this.selectedPortfolio();
    return !portfolio || (portfolio.holdings && portfolio.holdings.length === 0);
  });

  ngOnInit(): void {
    // Load portfolios on init
    this.portfolioFacade.loadPortfolios();

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
}
