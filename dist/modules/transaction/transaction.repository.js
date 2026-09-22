"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRepository = void 0;
const sequelize_1 = require("sequelize");
const all_transactions_model_1 = require("../../infrastructure/database/models/all-transactions.model");
const accounts_model_1 = require("../../infrastructure/database/models/accounts.model");
const transaction_types_model_1 = require("../../infrastructure/database/models/transaction-types.model");
// Shared eager-load includes for all queries
const TRANSACTION_INCLUDES = [
    {
        model: accounts_model_1.Account,
        as: "account",
        attributes: ["id", "accountName", "bank"],
    },
    {
        model: transaction_types_model_1.TransactionType,
        as: "transactionType",
        attributes: ["id", "type"],
    },
];
class TransactionRepository {
    async findAll(userId, offset, limit, filters) {
        const where = { userId };
        if (filters.accountId) {
            where["accountId"] = filters.accountId;
        }
        if (filters.transactionTypeId) {
            where["transactionTypeId"] = filters.transactionTypeId;
        }
        if (filters.startDate || filters.endDate) {
            const dateFilter = {};
            if (filters.startDate)
                dateFilter[sequelize_1.Op.gte] = filters.startDate;
            if (filters.endDate)
                dateFilter[sequelize_1.Op.lte] = filters.endDate;
            where["transactionDate"] = dateFilter;
        }
        const { rows, count } = await all_transactions_model_1.AllTransaction.findAndCountAll({
            where,
            include: TRANSACTION_INCLUDES,
            order: [["transactionDate", "DESC"], ["createdAt", "DESC"]],
            offset,
            limit,
        });
        return { rows, count };
    }
    async findById(id, userId) {
        return all_transactions_model_1.AllTransaction.findOne({
            where: { id, userId },
            include: TRANSACTION_INCLUDES,
        });
    }
    async create(data, userId) {
        const date = new Date(data.transactionDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const transaction = await all_transactions_model_1.AllTransaction.create({
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
        return (await this.findById(transaction.id, userId));
    }
    async update(id, userId, data) {
        const transaction = await all_transactions_model_1.AllTransaction.findOne({ where: { id, userId } });
        if (!transaction)
            return null;
        if (data.transactionDate !== undefined) {
            const date = new Date(data.transactionDate);
            transaction.transactionDate = data.transactionDate;
            transaction.year = date.getFullYear();
            transaction.month = date.getMonth() + 1;
        }
        if (data.accountId !== undefined)
            transaction.accountId = data.accountId;
        if (data.transactionTypeId !== undefined)
            transaction.transactionTypeId = data.transactionTypeId;
        if (data.amount !== undefined)
            transaction.amount = String(data.amount);
        if (data.paymentMethod !== undefined)
            transaction.paymentMethod = data.paymentMethod;
        if (data.remarks !== undefined)
            transaction.remarks = data.remarks;
        if (data.note !== undefined)
            transaction.note = data.note;
        await transaction.save();
        return this.findById(id, userId);
    }
    async delete(id, userId) {
        const deletedCount = await all_transactions_model_1.AllTransaction.destroy({ where: { id, userId } });
        return deletedCount > 0;
    }
}
exports.transactionRepository = new TransactionRepository();
//# sourceMappingURL=transaction.repository.js.map