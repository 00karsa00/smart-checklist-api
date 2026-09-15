import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import {
  ApiSuccessResponse,
  successResponse,
} from "../../common/responses/api-response";
import { Account } from "../../infrastructure/database/models/accounts.model";
import { TransactionType as TransactionTypeModel } from "../../infrastructure/database/models/transaction-types.model";

import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionListQuery,
} from "./dto/transaction.dto";
import { Transaction } from "./types/transaction.type";
import { transactionRepository } from "./transaction.repository";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

class TransactionService {
  async getAllTransactions(
    userId: string,
    page: number,
    limit: number,
    filters: TransactionListQuery,
  ): Promise<ApiSuccessResponse<Transaction[]>> {
    const offset = (page - 1) * limit;
    const { rows, count } = await transactionRepository.findAll(
      userId,
      offset,
      limit,
      filters,
    );

    return successResponse(rows as unknown as Transaction[], undefined, {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  }

  async getTransactionById(
    id: string,
    userId: string,
  ): Promise<ApiSuccessResponse<Transaction>> {
    const transaction = await transactionRepository.findById(id, userId);

    if (!transaction) {
      throw new AppError(
        404,
        ERROR_CODES.TRANSACTION_NOT_FOUND,
        "Transaction not found.",
      );
    }

    return successResponse(transaction as unknown as Transaction, undefined);
  }

  async createTransaction(
    data: CreateTransactionDto,
    userId: string,
  ): Promise<ApiSuccessResponse<Transaction>> {
    // Verify the account exists and belongs to this user
    const account = await Account.findOne({
      where: { id: data.accountId, userId },
    });

    if (!account) {
      throw new AppError(
        404,
        ERROR_CODES.ACCOUNT_NOT_FOUND,
        "Account not found.",
      );
    }

    // Verify the transaction type exists
    const transactionType = await TransactionTypeModel.findByPk(
      data.transactionTypeId,
    );

    if (!transactionType) {
      throw new AppError(
        404,
        ERROR_CODES.NOT_FOUND,
        "Transaction type not found.",
      );
    }

    const transaction = await transactionRepository.create(data, userId);
    return successResponse(transaction as unknown as Transaction, undefined);
  }

  async updateTransaction(
    id: string,
    userId: string,
    data: UpdateTransactionDto,
  ): Promise<ApiSuccessResponse<Transaction>> {
    const existing = await transactionRepository.findById(id, userId);

    if (!existing) {
      throw new AppError(
        404,
        ERROR_CODES.TRANSACTION_NOT_FOUND,
        "Transaction not found.",
      );
    }

    // If switching account, verify new account belongs to user
    if (data.accountId) {
      const account = await Account.findOne({
        where: { id: data.accountId, userId },
      });

      if (!account) {
        throw new AppError(
          404,
          ERROR_CODES.ACCOUNT_NOT_FOUND,
          "Account not found.",
        );
      }
    }

    // If switching transaction type, verify it exists
    if (data.transactionTypeId) {
      const transactionType = await TransactionTypeModel.findByPk(
        data.transactionTypeId,
      );

      if (!transactionType) {
        throw new AppError(
          404,
          ERROR_CODES.NOT_FOUND,
          "Transaction type not found.",
        );
      }
    }

    const updated = await transactionRepository.update(id, userId, data);
    return successResponse(updated as unknown as Transaction, undefined);
  }

  async deleteTransaction(
    id: string,
    userId: string,
  ): Promise<ApiSuccessResponse<null>> {
    const existing = await transactionRepository.findById(id, userId);

    if (!existing) {
      throw new AppError(
        404,
        ERROR_CODES.TRANSACTION_NOT_FOUND,
        "Transaction not found.",
      );
    }

    await transactionRepository.delete(id, userId);
    return successResponse(null, undefined);
  }
}

export const transactionService = new TransactionService();
