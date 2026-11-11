import { DbTransaction, PasswordTable, withTransaction } from "../../infrastructure/database";

/** One account kind's password table (admin_user_password, app_user_password, …). */
export class PasswordRepository {
  constructor(private readonly table: PasswordTable) {}

  async findHash(accountId: string): Promise<string | null> {
    const row = await this.table.findOne({ where: { accountId } });
    return row?.passwordHash ?? null;
  }

  /** Insert or replace the account's password hash. */
  async saveHash(
    accountId: string,
    passwordHash: string,
    transaction?: DbTransaction,
  ): Promise<void> {
    await this.table.upsert({ accountId, passwordHash }, { transaction });
  }

  /** Create an account and its password in one transaction: both are saved or neither. */
  createWithHash<A extends { id: string }>(
    insert: (transaction: DbTransaction) => Promise<A>,
    passwordHash: string | undefined,
  ): Promise<A> {
    return withTransaction(async (transaction) => {
      const account = await insert(transaction);
      if (passwordHash) await this.saveHash(account.id, passwordHash, transaction);
      return account;
    });
  }
}
