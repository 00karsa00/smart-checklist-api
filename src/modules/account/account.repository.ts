import { Op } from "sequelize";

import { Account, AccountStatus, AccountType } from "../../infrastructure/database/models/accounts.model";
import { AllTransaction } from "../../infrastructure/database/models/all-transactions.model";
import { CreateAccountDto, UpdateAccountDto, AccountListQuery } from "./dto/account.dto";
import { nextAccountId } from "./account.id-generator";

export interface PaginatedAccounts {
  rows: Account[];
  count: number;
}

/**
 * Data-access layer for accounts. Every method is scoped by `userId` so a user
 * can never read or mutate another user's account. This layer has no knowledge
 * of HTTP, JWT, or the Express request — it only talks to the database.
 */
class AccountRepository {
  async findAll(
    userId: string,
    offset: number,
    limit: number,
    filters: AccountListQuery,
  ): Promise<PaginatedAccounts> {
    const where: Record<string, unknown> = { userId };

    if (filters.status) {
      where["status"] = filters.status;
    }

    if (filters.type) {
      where["type"] = filters.type;
    }

    if (filters.bank) {
      where["bank"] = { [Op.iLike]: `%${filters.bank}%` };
    }

    // Free-text search across the human-relevant fields.
    if (filters.search) {
      const term = `%${filters.search}%`;
      where[Op.or as unknown as string] = [
        { accountName: { [Op.iLike]: term } },
        { bank: { [Op.iLike]: term } },
        { accountId: { [Op.iLike]: term } },
        { accountNumber: { [Op.iLike]: term } },
      ];
    }

    const { rows, count } = await Account.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });

    return { rows, count };
  }

  async findById(id: string, userId: string): Promise<Account | null> {
    return Account.findOne({ where: { id, userId } });
  }

  async findByAccountNumber(
    accountNumber: string,
    userId: string,
  ): Promise<Account | null> {
    return Account.findOne({ where: { accountNumber, userId } });
  }

  /** The highest existing account_id for a user, used to derive the next one. */
  async findLatestAccountId(userId: string): Promise<string | null> {
    const latest = await Account.findOne({
      where: { userId },
      order: [["accountId", "DESC"]],
      attributes: ["accountId"],
    });

    return latest?.accountId ?? null;
  }

  /** How many transactions reference this account (ownership already checked). */
  async countTransactions(accountId: string): Promise<number> {
    return AllTransaction.count({ where: { accountId } });
  }

  async findActiveAccountsDropdownList(
    userId: string,
    options: { page: number; limit: number; search: string | null },
  ): Promise<PaginatedAccounts> {
    const { page, limit, search } = options;
    const offset = (page - 1) * limit;
    const where: Record<string, unknown> = {
      userId,
      status: AccountStatus.ACTIVE,
    };

    if (search) {
      const term = `%${search}%`;
      where[Op.or as unknown as string] = [
        { accountName: { [Op.iLike]: term } },
        { bank: { [Op.iLike]: term } },
        { accountNumber: { [Op.iLike]: term } },
      ];
    }

    const { rows, count } = await Account.findAndCountAll({
      where,
      attributes: ["id", "accountName", "bank", "accountNumber"],
      order: [["accountName", "ASC"]],
      offset,
      limit,
    });

    return { rows, count };
  }

  async create(
    data: CreateAccountDto,
    userId: string,
    accountId: string,
  ): Promise<Account> {
    return Account.create({
      accountId,
      accountName: data.accountName,
      bank: data.bank,
      accountNumber: data.accountNumber ?? null,
      customerNumber: data.customerNumber ?? null,
      ifsc: data.ifsc ?? null,
      type: data.type,
      status: data.status ?? AccountStatus.ACTIVE,
      currentBalance: data.currentBalance !== undefined ? String(data.currentBalance) : "0",
      openingDate: data.openingDate ?? null,
      closingDate: data.closingDate ?? null,
      userId,
    });
  }

  /**
   * Applies a partial update to an owned account. `currentBalance`, `id`,
   * `accountId` and `userId` are deliberately not accepted here. When the
   * status transitions to CLOSED and no closingDate is supplied, today's date
   * is recorded automatically.
   */
  async update(
    id: string,
    userId: string,
    data: UpdateAccountDto,
  ): Promise<Account | null> {
    const account = await Account.findOne({ where: { id, userId } });

    if (!account) return null;

    if (data.accountName !== undefined) account.accountName = data.accountName;
    if (data.bank !== undefined) account.bank = data.bank;
    if (data.accountNumber !== undefined) account.accountNumber = data.accountNumber;
    if (data.customerNumber !== undefined) account.customerNumber = data.customerNumber;
    if (data.ifsc !== undefined) account.ifsc = data.ifsc;
    if (data.type !== undefined) account.type = data.type as AccountType;
    if (data.openingDate !== undefined) account.openingDate = data.openingDate;
    if (data.closingDate !== undefined) account.closingDate = data.closingDate;

    if (data.status !== undefined) {
      account.status = data.status as AccountStatus;

      // Populate closingDate when an account becomes closed and the caller
      // didn't provide one explicitly.
      if (
        data.status === AccountStatus.CLOSED &&
        data.closingDate === undefined &&
        !account.closingDate
      ) {
        account.closingDate = new Date().toISOString().slice(0, 10);
      }
    }

    await account.save();
    return account;
  }

  /** Soft delete: mark the account inactive rather than destroying the row. */
  async softDelete(id: string, userId: string): Promise<boolean> {
    const account = await Account.findOne({ where: { id, userId } });

    if (!account) return false;

    account.status = AccountStatus.INACTIVE;
    await account.save();
    return true;
  }
}

export const accountRepository = new AccountRepository();
