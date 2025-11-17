// T102: Transaction interfaces for frontend

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  fee: number | null;
  date: Date;
  notes: string | null;
  createdAt: Date;
}

export interface AddTransactionRequest {
  type: 'BUY' | 'SELL';
  quantity: number;
  pricePerUnit: number;
  fee?: number;
  date: Date;
  notes?: string;
}

export interface TransactionHistory {
  holdingId: string;
  symbol: string;
  transactions: Transaction[];
  totalBuyQuantity: number;
  totalSellQuantity: number;
  totalCost: number;
}
