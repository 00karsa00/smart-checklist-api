import { AccountType, AccountStatus } from "../../../infrastructure/database/models/accounts.model";

// ── Request body DTOs ─────────────────────────────────────────────────────────

export interface CreateAccountDto {
  accountName: string;
  bank: string;
  accountNumber: string;
  customerNumber?: string;
  ifsc?: string;
  type: AccountType;
  openingDate: string;       // YYYY-MM-DD
  currentBalance?: number;
}

export interface UpdateAccountDto {
  accountName?: string;
  bank?: string;
  accountNumber?: string;
  customerNumber?: string;
  ifsc?: string;
  type?: AccountType;
  status?: AccountStatus;
  openingDate?: string;
  closingDate?: string;
  currentBalance?: number;
}

// ── Request param / query interfaces ─────────────────────────────────────────

export interface AccountIdParams {
  id: string;
  [key: string]: string;
}

export interface AccountListQuery {
  page?: string;
  limit?: string;
  status?: string;
  type?: string;
}
