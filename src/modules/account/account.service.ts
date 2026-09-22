import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import {
  ApiSuccessResponse,
  PaginatedData,
  buildPaginatedData,
  successResponse,
} from "../../common/responses/api-response";

import { CreateAccountDto, UpdateAccountDto, AccountListQuery } from "./dto/account.dto";
import { Account } from "./types/account.type";
import { accountRepository } from "./account.repository";
import { nextAccountId } from "./account.id-generator";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_ACCOUNT_ID_RETRIES = 5;

/**
 * Account business logic. Receives clean business parameters (`userId`,
 * `payload`) — never the Express request. Owns account-id generation, ownership
 * rules, the deletion strategy, and the rule that balance is not editable here.
 * Returns the shared ApiSuccessResponse envelope.
 */
class AccountService {
  async getAllAccounts(
    userId: string,
    page: number,
    limit: number,
    filters: AccountListQuery,
  ): Promise<ApiSuccessResponse<PaginatedData<Account>>> {
    const safePage = page > 0 ? page : DEFAULT_PAGE;
    const safeLimit = limit > 0 ? limit : DEFAULT_LIMIT;
    const offset = (safePage - 1) * safeLimit;

    const { rows, count } = await accountRepository.findAll(userId, offset, safeLimit, filters);

    const data = buildPaginatedData(rows as unknown as Account[], {
      page: safePage,
      limit: safeLimit,
      total: count,
    });

    return successResponse(data, undefined);
  }

  async getAccountById(id: string, userId: string): Promise<ApiSuccessResponse<Account>> {
    const account = await accountRepository.findById(id, userId);

    if (!account) {
      throw new AppError(404, ERROR_CODES.ACCOUNT_NOT_FOUND, "Account not found.");
    }

    return successResponse(account as unknown as Account, undefined);
  }

  async createAccount(
    data: CreateAccountDto,
    userId: string,
  ): Promise<ApiSuccessResponse<Account>> {
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

    const account = await this.createWithGeneratedId(data, userId);
    return successResponse(account as unknown as Account, undefined);
  }

  async updateAccount(
    id: string,
    userId: string,
    data: UpdateAccountDto,
  ): Promise<ApiSuccessResponse<Account>> {
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
    return successResponse(updated as unknown as Account, undefined);
  }

  /**
   * Reusable deletion strategy: soft delete. Destructive deletion is refused
   * for accounts that are referenced by transactions; otherwise the account is
   * marked inactive so history and balances remain intact.
   */
  async deleteAccount(id: string, userId: string): Promise<ApiSuccessResponse<null>> {
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
    return successResponse(null, undefined);
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  /**
   * Generates the next per-user account id and creates the account, retrying a
   * few times if a concurrent create grabbed the same number (the composite
   * UNIQUE index is the source of truth).
   */
  private async createWithGeneratedId(
    data: CreateAccountDto,
    userId: string,
  ): Promise<Account> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_ACCOUNT_ID_RETRIES; attempt += 1) {
      const latest = await accountRepository.findLatestAccountId(userId);
      const accountId = nextAccountId(latest);

      try {
        return (await accountRepository.create(data, userId, accountId)) as unknown as Account;
      } catch (error) {
        // Unique-violation on (user_id, account_id) → retry with a fresh number.
        if (isUniqueViolation(error)) {
          lastError = error;
          continue;
        }
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

function isUniqueViolation(error: unknown): boolean {
  const name = (error as { name?: string })?.name;
  return name === "SequelizeUniqueConstraintError";
}

export const accountService = new AccountService();
