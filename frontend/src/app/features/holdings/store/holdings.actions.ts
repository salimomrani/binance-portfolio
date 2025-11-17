// T105: Holdings actions

import { createAction, props } from '@ngrx/store';
import { Holding } from '@/shared/models/portfolio.model';
import { Transaction, AddTransactionRequest } from '@/shared/models/holding.model';

// Load holdings for a portfolio
export const loadHoldings = createAction(
  '[Holdings] Load Holdings',
  props<{ portfolioId: string }>()
);

export const loadHoldingsSuccess = createAction(
  '[Holdings] Load Holdings Success',
  props<{ holdings: Holding[] }>()
);

export const loadHoldingsFailure = createAction(
  '[Holdings] Load Holdings Failure',
  props<{ error: string }>()
);

// Select holding
export const selectHolding = createAction(
  '[Holdings] Select Holding',
  props<{ holdingId: string }>()
);

export const clearSelectedHolding = createAction(
  '[Holdings] Clear Selected Holding'
);

// Load holding details
export const loadHoldingDetails = createAction(
  '[Holdings] Load Holding Details',
  props<{ portfolioId: string; holdingId: string }>()
);

export const loadHoldingDetailsSuccess = createAction(
  '[Holdings] Load Holding Details Success',
  props<{ holding: Holding }>()
);

export const loadHoldingDetailsFailure = createAction(
  '[Holdings] Load Holding Details Failure',
  props<{ error: string }>()
);

// Load transactions
export const loadTransactions = createAction(
  '[Holdings] Load Transactions',
  props<{ holdingId: string }>()
);

export const loadTransactionsSuccess = createAction(
  '[Holdings] Load Transactions Success',
  props<{ transactions: Transaction[] }>()
);

export const loadTransactionsFailure = createAction(
  '[Holdings] Load Transactions Failure',
  props<{ error: string }>()
);

// Add transaction
export const addTransaction = createAction(
  '[Holdings] Add Transaction',
  props<{ holdingId: string; transaction: AddTransactionRequest }>()
);

export const addTransactionSuccess = createAction(
  '[Holdings] Add Transaction Success',
  props<{ transaction: Transaction; updatedHolding: Holding }>()
);

export const addTransactionFailure = createAction(
  '[Holdings] Add Transaction Failure',
  props<{ error: string }>()
);

// Update holding
export const updateHolding = createAction(
  '[Holdings] Update Holding',
  props<{ portfolioId: string; holdingId: string; quantity?: number; averageCost?: number; notes?: string }>()
);

export const updateHoldingSuccess = createAction(
  '[Holdings] Update Holding Success',
  props<{ holding: Holding }>()
);

export const updateHoldingFailure = createAction(
  '[Holdings] Update Holding Failure',
  props<{ error: string }>()
);

// Delete holding
export const deleteHolding = createAction(
  '[Holdings] Delete Holding',
  props<{ portfolioId: string; holdingId: string }>()
);

export const deleteHoldingSuccess = createAction(
  '[Holdings] Delete Holding Success',
  props<{ holdingId: string }>()
);

export const deleteHoldingFailure = createAction(
  '[Holdings] Delete Holding Failure',
  props<{ error: string }>()
);
