import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { PaginatedData, buildPaginatedData, pageOffset } from "../../common/pagination";
import { accountService } from "../account/account.service";

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
    const offset = pageOffset({ page, limit });
    const { rows, count } = await transactionRepository.findAll(userId, offset, limit, filters);

    return buildPaginatedData(rows as unknown as Transaction[], {
      page,
      limit,
      total: count,
    });
  }

  async getTransactionById(id: string, userId: string): Promise<Transaction> {
    const transaction = await transactionRepository.findById(id, userId);

    if (!transaction) {
      throw new AppError(404, ERROR_CODES.TRANSACTION_NOT_FOUND, "Transaction not found.");
    }

    return transaction as unknown as Transaction;
  }

  async createTransaction(data: CreateTransactionDto, userId: string): Promise<Transaction> {
    await accountService.getAccountById(data.accountId, userId);
    await this.assertTransactionTypeExists(data.transactionTypeId);

    const transaction = await transactionRepository.create(data, userId);
    return transaction as unknown as Transaction;
  }

  async updateTransaction(
    id: string,
    userId: string,
    data: UpdateTransactionDto,
  ): Promise<Transaction> {
    await this.getTransactionById(id, userId);

    // Moving to another account or type: it must exist (and the account be owned).
    if (data.accountId) await accountService.getAccountById(data.accountId, userId);
    if (data.transactionTypeId) await this.assertTransactionTypeExists(data.transactionTypeId);

    const updated = await transactionRepository.update(id, userId, data);
    return updated as unknown as Transaction;
  }

  async deleteTransaction(id: string, userId: string): Promise<null> {
    await this.getTransactionById(id, userId);
    await transactionRepository.delete(id, userId);
    return null;
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private async assertTransactionTypeExists(id: string): Promise<void> {
    const transactionType = await transactionRepository.findTransactionTypeById(id);

    if (!transactionType) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, "Transaction type not found.");
    }
  }
}

export const transactionService = new TransactionService();
