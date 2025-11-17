// T078: Portfolio facade service to abstract store complexity

import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Portfolio, CreatePortfolioRequest, UpdatePortfolioRequest, AddHoldingRequest, UpdateHoldingRequest } from '../../../shared/models/portfolio.model';
import * as PortfolioActions from '../store/portfolio.actions';
import * as PortfolioSelectors from '../store/portfolio.selectors';

/**
 * Facade service that provides a simplified API for portfolio state management
 * Components interact with this service instead of directly with the store
 */
@Injectable({
  providedIn: 'root',
})
export class PortfolioFacadeService {
  private readonly store = inject(Store);

  // Observables for component subscriptions
  readonly portfolios$ = this.store.select(PortfolioSelectors.selectAllPortfolios);
  readonly selectedPortfolio$ = this.store.select(PortfolioSelectors.selectSelectedPortfolio);
  readonly selectedPortfolioId$ = this.store.select(PortfolioSelectors.selectSelectedPortfolioId);
  readonly loading$ = this.store.select(PortfolioSelectors.selectPortfolioLoading);
  readonly error$ = this.store.select(PortfolioSelectors.selectPortfolioError);
  readonly lastUpdated$ = this.store.select(PortfolioSelectors.selectLastUpdated);
  readonly hasPortfolios$ = this.store.select(PortfolioSelectors.selectHasPortfolios);
  readonly portfolioCount$ = this.store.select(PortfolioSelectors.selectPortfolioCount);
  readonly defaultPortfolio$ = this.store.select(PortfolioSelectors.selectDefaultPortfolio);

  // Selected portfolio data
  readonly selectedPortfolioHoldings$ = this.store.select(
    PortfolioSelectors.selectSelectedPortfolioHoldings
  );
  readonly selectedPortfolioTotalValue$ = this.store.select(
    PortfolioSelectors.selectSelectedPortfolioTotalValue
  );
  readonly selectedPortfolioGainLoss$ = this.store.select(
    PortfolioSelectors.selectSelectedPortfolioGainLoss
  );
  readonly selectedPortfolioHoldingsCount$ = this.store.select(
    PortfolioSelectors.selectSelectedPortfolioHoldingsCount
  );
  readonly isPortfolioLoaded$ = this.store.select(
    PortfolioSelectors.selectIsPortfolioLoaded
  );
  readonly portfolioViewModel$ = this.store.select(
    PortfolioSelectors.selectPortfolioViewModel
  );

  // Holdings analysis
  readonly sortedHoldingsByValue$ = this.store.select(
    PortfolioSelectors.selectSortedHoldingsByValue
  );
  readonly holdingsWithGains$ = this.store.select(
    PortfolioSelectors.selectHoldingsWithGains
  );
  readonly holdingsWithLosses$ = this.store.select(
    PortfolioSelectors.selectHoldingsWithLosses
  );
  readonly bestPerformingHolding$ = this.store.select(
    PortfolioSelectors.selectBestPerformingHolding
  );
  readonly worstPerformingHolding$ = this.store.select(
    PortfolioSelectors.selectWorstPerformingHolding
  );

  /**
   * Load all portfolios
   */
  loadPortfolios(): void {
    this.store.dispatch(PortfolioActions.loadPortfolios());
  }

  /**
   * Load portfolio details by ID
   */
  loadPortfolioDetails(portfolioId: string): void {
    this.store.dispatch(PortfolioActions.loadPortfolioDetails({ portfolioId }));
  }

  /**
   * Select a portfolio
   */
  selectPortfolio(portfolioId: string): void {
    this.store.dispatch(PortfolioActions.selectPortfolio({ portfolioId }));
  }

  /**
   * Create a new portfolio
   */
  createPortfolio(request: CreatePortfolioRequest): void {
    this.store.dispatch(PortfolioActions.createPortfolio({ request }));
  }

  /**
   * Update portfolio details
   */
  updatePortfolio(portfolioId: string, request: UpdatePortfolioRequest): void {
    this.store.dispatch(PortfolioActions.updatePortfolio({ portfolioId, request }));
  }

  /**
   * Delete a portfolio
   */
  deletePortfolio(portfolioId: string): void {
    this.store.dispatch(PortfolioActions.deletePortfolio({ portfolioId }));
  }

  /**
   * Update prices for holdings
   */
  updatePrices(prices: Map<string, number>): void {
    this.store.dispatch(PortfolioActions.updatePrices({ prices }));
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.store.dispatch(PortfolioActions.clearError());
  }

  /**
   * Get portfolio by ID as an observable
   */
  getPortfolioById(portfolioId: string): Observable<Portfolio | undefined> {
    return this.store.select(PortfolioSelectors.selectPortfolioById(portfolioId));
  }

  /**
   * Add a holding to a portfolio
   */
  addHolding(portfolioId: string, request: AddHoldingRequest): void {
    this.store.dispatch(PortfolioActions.addHolding({ portfolioId, request }));
  }

  /**
   * Update a holding
   */
  updateHolding(portfolioId: string, holdingId: string, request: UpdateHoldingRequest): void {
    this.store.dispatch(PortfolioActions.updateHolding({ portfolioId, holdingId, request }));
  }

  /**
   * Delete a holding
   */
  deleteHolding(portfolioId: string, holdingId: string): void {
    this.store.dispatch(PortfolioActions.deleteHolding({ portfolioId, holdingId }));
  }
}
