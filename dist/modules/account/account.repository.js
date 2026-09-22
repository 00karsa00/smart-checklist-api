"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountRepository = void 0;
const sequelize_1 = require("sequelize");
const accounts_model_1 = require("../../infrastructure/database/models/accounts.model");
const all_transactions_model_1 = require("../../infrastructure/database/models/all-transactions.model");
/**
 * Data-access layer for accounts. Every method is scoped by `userId` so a user
 * can never read or mutate another user's account. This layer has no knowledge
 * of HTTP, JWT, or the Express request — it only talks to the database.
 */
class AccountRepository {
    async findAll(userId, offset, limit, filters) {
        const where = { userId };
        if (filters.status) {
            where["status"] = filters.status;
        }
        if (filters.type) {
            where["type"] = filters.type;
        }
        if (filters.bank) {
            where["bank"] = { [sequelize_1.Op.iLike]: `%${filters.bank}%` };
        }
        // Free-text search across the human-relevant fields.
        if (filters.search) {
            const term = `%${filters.search}%`;
            where[sequelize_1.Op.or] = [
                { accountName: { [sequelize_1.Op.iLike]: term } },
                { bank: { [sequelize_1.Op.iLike]: term } },
                { accountId: { [sequelize_1.Op.iLike]: term } },
                { accountNumber: { [sequelize_1.Op.iLike]: term } },
            ];
        }
        const { rows, count } = await accounts_model_1.Account.findAndCountAll({
            where,
            order: [["createdAt", "DESC"]],
            offset,
            limit,
        });
        return { rows, count };
    }
    async findById(id, userId) {
        return accounts_model_1.Account.findOne({ where: { id, userId } });
    }
    async findByAccountNumber(accountNumber, userId) {
        return accounts_model_1.Account.findOne({ where: { accountNumber, userId } });
    }
    /** The highest existing account_id for a user, used to derive the next one. */
    async findLatestAccountId(userId) {
        const latest = await accounts_model_1.Account.findOne({
            where: { userId },
            order: [["accountId", "DESC"]],
            attributes: ["accountId"],
        });
        return latest?.accountId ?? null;
    }
    /** How many transactions reference this account (ownership already checked). */
    async countTransactions(accountId) {
        return all_transactions_model_1.AllTransaction.count({ where: { accountId } });
    }
    async create(data, userId, accountId) {
        return accounts_model_1.Account.create({
            accountId,
            accountName: data.accountName,
            bank: data.bank,
            accountNumber: data.accountNumber ?? null,
            customerNumber: data.customerNumber ?? null,
            ifsc: data.ifsc ?? null,
            type: data.type,
            status: data.status ?? accounts_model_1.AccountStatus.ACTIVE,
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
    async update(id, userId, data) {
        const account = await accounts_model_1.Account.findOne({ where: { id, userId } });
        if (!account)
            return null;
        if (data.accountName !== undefined)
            account.accountName = data.accountName;
        if (data.bank !== undefined)
            account.bank = data.bank;
        if (data.accountNumber !== undefined)
            account.accountNumber = data.accountNumber;
        if (data.customerNumber !== undefined)
            account.customerNumber = data.customerNumber;
        if (data.ifsc !== undefined)
            account.ifsc = data.ifsc;
        if (data.type !== undefined)
            account.type = data.type;
        if (data.openingDate !== undefined)
            account.openingDate = data.openingDate;
        if (data.closingDate !== undefined)
            account.closingDate = data.closingDate;
        if (data.status !== undefined) {
            account.status = data.status;
            // Populate closingDate when an account becomes closed and the caller
            // didn't provide one explicitly.
            if (data.status === accounts_model_1.AccountStatus.CLOSED &&
                data.closingDate === undefined &&
                !account.closingDate) {
                account.closingDate = new Date().toISOString().slice(0, 10);
            }
        }
        await account.save();
        return account;
    }
    /** Soft delete: mark the account inactive rather than destroying the row. */
    async softDelete(id, userId) {
        const account = await accounts_model_1.Account.findOne({ where: { id, userId } });
        if (!account)
            return false;
        account.status = accounts_model_1.AccountStatus.INACTIVE;
        await account.save();
        return true;
    }
}
exports.accountRepository = new AccountRepository();
//# sourceMappingURL=account.repository.js.map