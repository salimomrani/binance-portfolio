// T104: Holdings state

import { Holding } from '@/shared/models/portfolio.model';
import { Transaction } from '@/shared/models/holding.model';

export interface HoldingsState {
  holdings: Holding[];
  selectedHoldingId: string | null;
  selectedHolding: Holding | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const initialHoldingsState: HoldingsState = {
  holdings: [],
  selectedHoldingId: null,
  selectedHolding: null,
  transactions: [],
  loading: false,
  error: null,
  lastUpdated: null,
};
