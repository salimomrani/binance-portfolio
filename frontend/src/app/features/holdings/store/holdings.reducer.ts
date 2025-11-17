// T106: Holdings reducer

import { createReducer, on } from '@ngrx/store';
import { initialHoldingsState } from './holdings.state';
import * as HoldingsActions from './holdings.actions';

export const holdingsReducer = createReducer(
  initialHoldingsState,

  // Load holdings
  on(HoldingsActions.loadHoldings, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(HoldingsActions.loadHoldingsSuccess, (state, { holdings }) => ({
    ...state,
    holdings,
    loading: false,
    error: null,
    lastUpdated: new Date(),
  })),
  on(HoldingsActions.loadHoldingsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Select holding
  on(HoldingsActions.selectHolding, (state, { holdingId }) => {
    const selectedHolding = state.holdings.find(h => h.id === holdingId) || null;
    return {
      ...state,
      selectedHoldingId: holdingId,
      selectedHolding,
    };
  }),
  on(HoldingsActions.clearSelectedHolding, (state) => ({
    ...state,
    selectedHoldingId: null,
    selectedHolding: null,
    transactions: [],
  })),

  // Load holding details
  on(HoldingsActions.loadHoldingDetails, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(HoldingsActions.loadHoldingDetailsSuccess, (state, { holding }) => ({
    ...state,
    selectedHolding: holding,
    selectedHoldingId: holding.id,
    loading: false,
    error: null,
  })),
  on(HoldingsActions.loadHoldingDetailsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load transactions
  on(HoldingsActions.loadTransactions, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(HoldingsActions.loadTransactionsSuccess, (state, { transactions }) => ({
    ...state,
    transactions,
    loading: false,
    error: null,
  })),
  on(HoldingsActions.loadTransactionsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Add transaction
  on(HoldingsActions.addTransaction, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(HoldingsActions.addTransactionSuccess, (state, { transaction, updatedHolding }) => {
    // Update the holding in holdings list
    const updatedHoldings = state.holdings.map(h =>
      h.id === updatedHolding.id ? updatedHolding : h
    );

    // Add transaction to list
    const updatedTransactions = [transaction, ...state.transactions];

    return {
      ...state,
      holdings: updatedHoldings,
      selectedHolding: updatedHolding,
      transactions: updatedTransactions,
      loading: false,
      error: null,
    };
  }),
  on(HoldingsActions.addTransactionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Update holding
  on(HoldingsActions.updateHolding, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(HoldingsActions.updateHoldingSuccess, (state, { holding }) => {
    const updatedHoldings = state.holdings.map(h =>
      h.id === holding.id ? holding : h
    );
    return {
      ...state,
      holdings: updatedHoldings,
      selectedHolding: state.selectedHoldingId === holding.id ? holding : state.selectedHolding,
      loading: false,
      error: null,
    };
  }),
  on(HoldingsActions.updateHoldingFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Delete holding
  on(HoldingsActions.deleteHolding, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(HoldingsActions.deleteHoldingSuccess, (state, { holdingId }) => {
    const updatedHoldings = state.holdings.filter(h => h.id !== holdingId);
    return {
      ...state,
      holdings: updatedHoldings,
      selectedHolding: state.selectedHoldingId === holdingId ? null : state.selectedHolding,
      selectedHoldingId: state.selectedHoldingId === holdingId ? null : state.selectedHoldingId,
      loading: false,
      error: null,
    };
  }),
  on(HoldingsActions.deleteHoldingFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  }))
);
