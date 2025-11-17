// T072: Portfolio API service

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  Portfolio,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  PortfolioStatistics,
} from '../../../shared/models/portfolio.model';

@Injectable({
  providedIn: 'root',
})
export class PortfolioApiService {
  private readonly api = inject(ApiService);

  /**
   * Get all portfolios for the current user
   */
  getPortfolios(): Observable<Portfolio[]> {
    return this.api.get<Portfolio[]>('/portfolios');
  }

  /**
   * Get portfolio details by ID
   */
  getPortfolioById(portfolioId: string): Observable<Portfolio> {
    return this.api.get<Portfolio>(`/portfolios/${portfolioId}`);
  }

  /**
   * Create a new portfolio
   */
  createPortfolio(request: CreatePortfolioRequest): Observable<Portfolio> {
    return this.api.post<Portfolio>('/portfolios', request);
  }

  /**
   * Update portfolio details
   */
  updatePortfolio(portfolioId: string, request: UpdatePortfolioRequest): Observable<Portfolio> {
    return this.api.patch<Portfolio>(`/portfolios/${portfolioId}`, request);
  }

  /**
   * Delete a portfolio
   */
  deletePortfolio(portfolioId: string): Observable<void> {
    return this.api.delete<void>(`/portfolios/${portfolioId}`);
  }

  /**
   * Get portfolio statistics
   */
  getPortfolioStatistics(portfolioId: string): Observable<PortfolioStatistics> {
    return this.api.get<PortfolioStatistics>(`/portfolios/${portfolioId}/statistics`);
  }
}
