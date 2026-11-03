import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { PaginatedData, buildPaginatedData } from "../../common/pagination";
import { accountRepository } from "../account/account.repository";

import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionListQuery,
} from "./dto/transaction.dto";
import { Transaction } from "./types/transaction.type";
import { transactionRepository } from "./transaction.repository";

class TransactionService {
  async getAllTransactions(
    userId: string,
    page: number,
    limit: number,
    filters: TransactionListQuery,
  ): Promise<PaginatedData<Transaction>> {
    const offset = (page - 1) * limit;
    const { rows, count } = await transactionRepository.findAll(
      userId,
      offset,
      limit,
      filters,
    );

    return buildPaginatedData(rows as unknown as Transaction[], {
      page,
      limit,
      total: count,
    });
  }

  async getTransactionById(
    id: string,
    userId: string,
  ): Promise<Transaction> {
    const transaction = await transactionRepository.findById(id, userId);

    if (!transaction) {
      throw new AppError(
        404,
        ERROR_CODES.TRANSACTION_NOT_FOUND,
        "Transaction not found.",
      );
    }

    return transaction as unknown as Transaction;
  }

  async createTransaction(
    data: CreateTransactionDto,
    userId: string,
  ): Promise<Transaction> {
    // Verify the account exists and belongs to this user
    const account = await accountRepository.findById(data.accountId, userId);

    if (!account) {
      throw new AppError(
        404,
        ERROR_CODES.ACCOUNT_NOT_FOUND,
        "Account not found.",
      );
    }

    // Verify the transaction type exists
    const transactionType = await transactionRepository.findTransactionTypeById(data.transactionTypeId);

    if (!transactionType) {
      throw new AppError(
        404,
        ERROR_CODES.NOT_FOUND,
        "Transaction type not found.",
      );
    }

    const transaction = await transactionRepository.create(data, userId);
    return transaction as unknown as Transaction;
  }

  async updateTransaction(
    id: string,
    userId: string,
    data: UpdateTransactionDto,
  ): Promise<Transaction> {
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
      const account = await accountRepository.findById(data.accountId, userId);

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
      const transactionType = await transactionRepository.findTransactionTypeById(data.transactionTypeId);

      if (!transactionType) {
        throw new AppError(
          404,
          ERROR_CODES.NOT_FOUND,
          "Transaction type not found.",
        );
      }
    }

    const updated = await transactionRepository.update(id, userId, data);
    return updated as unknown as Transaction;
  }

  async deleteTransaction(
    id: string,
    userId: string,
  ): Promise<null> {
    const existing = await transactionRepository.findById(id, userId);

    if (!existing) {
      throw new AppError(
        404,
        ERROR_CODES.TRANSACTION_NOT_FOUND,
        "Transaction not found.",
      );
    }

    await transactionRepository.delete(id, userId);
    return null;
  }
}

export const transactionService = new TransactionService();
