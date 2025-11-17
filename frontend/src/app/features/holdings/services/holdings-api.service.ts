// Holdings API service for transaction operations

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Holding } from '../../../shared/models/portfolio.model';
import { Transaction, AddTransactionRequest } from '../../../shared/models/holding.model';

@Injectable({
  providedIn: 'root',
})
export class HoldingsApiService {
  private readonly api = inject(ApiService);

  /**
   * Get all holdings for a portfolio
   */
  getHoldings(portfolioId: string): Observable<Holding[]> {
    return this.api.get<Holding[]>(`/portfolios/${portfolioId}/holdings`);
  }

  /**
   * Get holding details by ID
   */
  getHoldingById(portfolioId: string, holdingId: string): Observable<Holding> {
    return this.api.get<Holding>(`/portfolios/${portfolioId}/holdings/${holdingId}`);
  }

  /**
   * Get transactions for a holding
   */
  getTransactions(holdingId: string): Observable<Transaction[]> {
    return this.api.get<Transaction[]>(`/holdings/${holdingId}/transactions`);
  }

  /**
   * Add a transaction to a holding
   */
  addTransaction(holdingId: string, request: AddTransactionRequest): Observable<{ transaction: Transaction; updatedHolding: Holding }> {
    return this.api.post<{ transaction: Transaction; updatedHolding: Holding }>(
      `/holdings/${holdingId}/transactions`,
      request
    );
  }
}
