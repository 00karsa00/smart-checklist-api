import { Account, AccountStatus, AccountType } from "../../infrastructure/database/models/accounts.model";
import { CreateAccountDto, UpdateAccountDto, AccountListQuery } from "./dto/account.dto";

export interface PaginatedAccounts {
  rows: Account[];
  count: number;
}

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

  async create(data: CreateAccountDto, userId: string): Promise<Account> {
    return Account.create({
      accountName: data.accountName,
      bank: data.bank,
      accountNumber: data.accountNumber,
      customerNumber: data.customerNumber ?? null,
      ifsc: data.ifsc ?? null,
      type: data.type,
      status: AccountStatus.ACTIVE,
      currentBalance: data.currentBalance !== undefined ? String(data.currentBalance) : "0",
      openingDate: data.openingDate,
      closingDate: null,
      userId,
    });
  }

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
    if (data.status !== undefined) account.status = data.status as AccountStatus;
    if (data.openingDate !== undefined) account.openingDate = data.openingDate;
    if (data.closingDate !== undefined) account.closingDate = data.closingDate;
    if (data.currentBalance !== undefined) account.currentBalance = String(data.currentBalance);

    await account.save();
    return account;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const deletedCount = await Account.destroy({ where: { id, userId } });
    return deletedCount > 0;
  }
}

export const accountRepository = new AccountRepository();
