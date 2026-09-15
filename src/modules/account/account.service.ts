import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import {
  ApiSuccessResponse,
  successResponse,
} from "../../common/responses/api-response";

import { CreateAccountDto, UpdateAccountDto, AccountListQuery } from "./dto/account.dto";
import { Account } from "./types/account.type";
import { accountRepository } from "./account.repository";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

class AccountService {
  async getAllAccounts(
    userId: string,
    page: number,
    limit: number,
    filters: AccountListQuery,
  ): Promise<ApiSuccessResponse<Account[]>> {
    const offset = (page - 1) * limit;
    const { rows, count } = await accountRepository.findAll(userId, offset, limit, filters);

    return successResponse(rows as unknown as Account[], undefined, {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
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
    // Prevent duplicate account numbers for the same user
    const existing = await accountRepository.findByAccountNumber(data.accountNumber, userId);

    if (existing) {
      throw new AppError(
        409,
        ERROR_CODES.ACCOUNT_ALREADY_EXISTS,
        "An account with this account number already exists.",
      );
    }

    const account = await accountRepository.create(data, userId);
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

    // If changing account number, check it's not already taken by another account
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

  async deleteAccount(id: string, userId: string): Promise<ApiSuccessResponse<null>> {
    const existing = await accountRepository.findById(id, userId);

    if (!existing) {
      throw new AppError(404, ERROR_CODES.ACCOUNT_NOT_FOUND, "Account not found.");
    }

    await accountRepository.delete(id, userId);
    return successResponse(null, undefined);
  }
}

export const accountService = new AccountService();
