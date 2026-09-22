import { AccountType, AccountStatus } from "../../../infrastructure/database/models/accounts.model";

// ── Request body DTOs ─────────────────────────────────────────────────────────
//
// Note on ownership & identity:
//   - `id`, `userId` and `accountId` are NEVER accepted from the client.
//     `userId` comes from the JWT context; `id`/`accountId` are generated.
//   - `currentBalance` is only accepted at creation time (initial balance).
//     It is intentionally absent from UpdateAccountDto — balance changes are
//     owned by the (future) transaction module, not this CRUD API.

export interface CreateAccountDto {
  accountName: string;
  bank: string;
  accountNumber?: string | null;
  customerNumber?: string | null;
  ifsc?: string | null;
  type: AccountType;
  status?: AccountStatus;
  openingDate?: string | null; // YYYY-MM-DD
  closingDate?: string | null; // YYYY-MM-DD
  currentBalance?: number;
}

export interface UpdateAccountDto {
  accountName?: string;
  bank?: string;
  accountNumber?: string | null;
  customerNumber?: string | null;
  ifsc?: string | null;
  type?: AccountType;
  status?: AccountStatus;
  openingDate?: string | null;
  closingDate?: string | null;
  // currentBalance is intentionally NOT updatable here.
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
  bank?: string;
  search?: string;
}
