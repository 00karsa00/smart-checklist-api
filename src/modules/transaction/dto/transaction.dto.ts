// ── Request body DTOs ─────────────────────────────────────────────────────────

export interface CreateTransactionDto {
  transactionDate: string; // YYYY-MM-DD
  accountId: string; // UUID
  transactionTypeId: string; // UUID
  amount: number;
  paymentMethod?: string;
  remarks?: string;
  note?: string;
}

export interface UpdateTransactionDto {
  transactionDate?: string;
  accountId?: string;
  transactionTypeId?: string;
  amount?: number;
  paymentMethod?: string;
  remarks?: string;
  note?: string;
}

// ── Request param / query interfaces ─────────────────────────────────────────

export interface TransactionIdParams {
  id: string;
  [key: string]: string;
}

export interface TransactionListQuery {
  page?: string;
  limit?: string;
  accountId?: string;
  transactionTypeId?: string;
  startDate?: string;
  endDate?: string;
}
