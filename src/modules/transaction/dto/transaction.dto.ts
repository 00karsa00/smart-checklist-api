import { PageQuery } from "../../../common/pagination";

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

export interface TransactionListQuery extends PageQuery {
  accountId?: string;
  transactionTypeId?: string;
  startDate?: string;
  endDate?: string;
}
