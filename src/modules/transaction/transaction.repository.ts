import { Op } from "sequelize";

import { AllTransaction } from "../../infrastructure/database/models/all-transactions.model";
import { Account } from "../../infrastructure/database/models/accounts.model";
import { TransactionType } from "../../infrastructure/database/models/transaction-types.model";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionListQuery,
} from "./dto/transaction.dto";

export interface PaginatedTransactions {
  rows: AllTransaction[];
  count: number;
}

// Shared eager-load includes for all queries
const TRANSACTION_INCLUDES = [
  {
    model: Account,
    as: "account",
    attributes: ["id", "accountName", "bank"],
  },
  {
    model: TransactionType,
    as: "transactionType",
    attributes: ["id", "type"],
  },
];

class TransactionRepository {
  async findAll(
    userId: string,
    offset: number,
    limit: number,
    filters: TransactionListQuery,
  ): Promise<PaginatedTransactions> {
    const where: Record<string, unknown> = { userId };

    if (filters.accountId) {
      where["accountId"] = filters.accountId;
    }

    if (filters.transactionTypeId) {
      where["transactionTypeId"] = filters.transactionTypeId;
    }

    if (filters.startDate || filters.endDate) {
      const dateFilter: Record<string, string> = {};
      if (filters.startDate) dateFilter[Op.gte as unknown as string] = filters.startDate;
      if (filters.endDate) dateFilter[Op.lte as unknown as string] = filters.endDate;
      where["transactionDate"] = dateFilter;
    }

    const { rows, count } = await AllTransaction.findAndCountAll({
      where,
      include: TRANSACTION_INCLUDES,
      order: [["transactionDate", "DESC"], ["createdAt", "DESC"]],
      offset,
      limit,
    });

    return { rows, count };
  }

  async findById(id: string, userId: string): Promise<AllTransaction | null> {
    return AllTransaction.findOne({
      where: { id, userId },
      include: TRANSACTION_INCLUDES,
    });
  }

  async create(
    data: CreateTransactionDto,
    userId: string,
  ): Promise<AllTransaction> {
    const date = new Date(data.transactionDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const transaction = await AllTransaction.create({
      transactionDate: data.transactionDate,
      year,
      month,
      accountId: data.accountId,
      transactionTypeId: data.transactionTypeId,
      amount: String(data.amount),
      paymentMethod: data.paymentMethod ?? null,
      remarks: data.remarks ?? null,
      note: data.note ?? null,
      userId,
    });

    // Re-fetch with associations
    return (await this.findById(transaction.id, userId))!;
  }

  async update(
    id: string,
    userId: string,
    data: UpdateTransactionDto,
  ): Promise<AllTransaction | null> {
    const transaction = await AllTransaction.findOne({ where: { id, userId } });

    if (!transaction) return null;

    if (data.transactionDate !== undefined) {
      const date = new Date(data.transactionDate);
      transaction.transactionDate = data.transactionDate;
      transaction.year = date.getFullYear();
      transaction.month = date.getMonth() + 1;
    }

    if (data.accountId !== undefined) transaction.accountId = data.accountId;
    if (data.transactionTypeId !== undefined) transaction.transactionTypeId = data.transactionTypeId;
    if (data.amount !== undefined) transaction.amount = String(data.amount);
    if (data.paymentMethod !== undefined) transaction.paymentMethod = data.paymentMethod;
    if (data.remarks !== undefined) transaction.remarks = data.remarks;
    if (data.note !== undefined) transaction.note = data.note;

    await transaction.save();

    return this.findById(id, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const deletedCount = await AllTransaction.destroy({ where: { id, userId } });
    return deletedCount > 0;
  }
}

export const transactionRepository = new TransactionRepository();
