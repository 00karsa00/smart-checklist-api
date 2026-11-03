import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { PaginatedData, buildPaginatedData } from "../../common/pagination";
import { isUniqueViolation } from "../../infrastructure/database";

import { CreateAccountDto, UpdateAccountDto, AccountListQuery } from "./dto/account.dto";
import { Account } from "./types/account.type";
import { accountRepository } from "./account.repository";
import { nextAccountId } from "./account.id-generator";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_ACCOUNT_ID_RETRIES = 5;

/**
 * Account business logic. Receives clean business parameters (`userId`,
 * `payload`) — never the HTTP request. Owns account-id generation, ownership
 * rules, the deletion strategy, and the rule that balance is not editable here.
 */
class AccountService {
  async getAllAccounts(
    userId: string,
    page: number,
    limit: number,
    filters: AccountListQuery,
  ): Promise<PaginatedData<Account>> {
    const safePage = page > 0 ? page : DEFAULT_PAGE;
    const safeLimit = limit > 0 ? limit : DEFAULT_LIMIT;
    const offset = (safePage - 1) * safeLimit;

    const { rows, count } = await accountRepository.findAll(userId, offset, safeLimit, filters);

    return buildPaginatedData(rows as unknown as Account[], {
      page: safePage,
      limit: safeLimit,
      total: count,
    });
  }

  async getAccountById(id: string, userId: string): Promise<Account> {
    const account = await accountRepository.findById(id, userId);

    if (!account) {
      throw new AppError(404, ERROR_CODES.ACCOUNT_NOT_FOUND, "Account not found.");
    }

    return account as unknown as Account;
  }

  async createAccount(data: CreateAccountDto, userId: string): Promise<Account> {
    // Prevent duplicate account numbers for the same user (when provided).
    if (data.accountNumber) {
      const existing = await accountRepository.findByAccountNumber(data.accountNumber, userId);

      if (existing) {
        throw new AppError(
          409,
          ERROR_CODES.ACCOUNT_ALREADY_EXISTS,
          "An account with this account number already exists.",
        );
      }
    }

    return this.createWithGeneratedId(data, userId);
  }

  async updateAccount(id: string, userId: string, data: UpdateAccountDto): Promise<Account> {
    const existing = await accountRepository.findById(id, userId);

    if (!existing) {
      throw new AppError(404, ERROR_CODES.ACCOUNT_NOT_FOUND, "Account not found.");
    }

    // If changing account number, ensure it isn't taken by another account.
    if (data.accountNumber && data.accountNumber !== existing.accountNumber) {
      const duplicate = await accountRepository.findByAccountNumber(data.accountNumber, userId);

      if (duplicate) {
        throw new AppError(
          409,
          ERROR_CODES.ACCOUNT_ALREADY_EXISTS,
          "An account with this account number already exists.",
        );
      }
    }

    const updated = await accountRepository.update(id, userId, data);
    return updated as unknown as Account;
  }

  /**
   * Reusable deletion strategy: soft delete. Destructive deletion is refused
   * for accounts that are referenced by transactions; otherwise the account is
   * marked inactive so history and balances remain intact.
   */
  async deleteAccount(id: string, userId: string): Promise<null> {
    const existing = await accountRepository.findById(id, userId);

    if (!existing) {
      throw new AppError(404, ERROR_CODES.ACCOUNT_NOT_FOUND, "Account not found.");
    }

    const transactionCount = await accountRepository.countTransactions(existing.id);

    if (transactionCount > 0) {
      throw new AppError(
        409,
        ERROR_CODES.ACCOUNT_HAS_TRANSACTIONS,
        "This account has transactions and cannot be deleted. Deactivate it instead.",
      );
    }

    await accountRepository.softDelete(id, userId);
    return null;
  }

  async getActiveAccountDropdownList(
    userId: string,
    payload: { page?: number; limit?: number; search?: string | null },
  ): Promise<PaginatedData<Account>> {
    const { page = 1, limit = 100, search = null } = payload;
    const { rows, count } = await accountRepository.findActiveAccountsDropdownList(userId, {
      page,
      limit,
      search,
    });
    return buildPaginatedData(rows as unknown as Account[], { page, limit, total: count });
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  /**
   * Generates the next per-user account id and creates the account, retrying a
   * few times if a concurrent create grabbed the same number (the composite
   * UNIQUE index is the source of truth).
   */
  private async createWithGeneratedId(data: CreateAccountDto, userId: string): Promise<Account> {
    for (let attempt = 0; attempt < MAX_ACCOUNT_ID_RETRIES; attempt += 1) {
      const latest = await accountRepository.findLatestAccountId(userId);
      const accountId = nextAccountId(latest);

      try {
        return (await accountRepository.create(data, userId, accountId)) as unknown as Account;
      } catch (error) {
        // Unique-violation on (user_id, account_id) → retry with a fresh number.
        if (isUniqueViolation(error)) continue;
        throw error;
      }
    }

    throw new AppError(
      500,
      ERROR_CODES.DATABASE_ERROR,
      "Could not allocate a unique account id. Please retry.",
    );
  }
}

export const accountService = new AccountService();
