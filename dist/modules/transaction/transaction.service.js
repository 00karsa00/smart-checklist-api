"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionService = void 0;
const app_error_1 = require("../../common/errors/app.error");
const error_codes_1 = require("../../common/errors/error.codes");
const api_response_1 = require("../../common/responses/api-response");
const accounts_model_1 = require("../../infrastructure/database/models/accounts.model");
const transaction_types_model_1 = require("../../infrastructure/database/models/transaction-types.model");
const transaction_repository_1 = require("./transaction.repository");
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
class TransactionService {
    async getAllTransactions(userId, page, limit, filters) {
        const offset = (page - 1) * limit;
        const { rows, count } = await transaction_repository_1.transactionRepository.findAll(userId, offset, limit, filters);
        return (0, api_response_1.successResponse)(rows, undefined, {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        });
    }
    async getTransactionById(id, userId) {
        const transaction = await transaction_repository_1.transactionRepository.findById(id, userId);
        if (!transaction) {
            throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.TRANSACTION_NOT_FOUND, "Transaction not found.");
        }
        return (0, api_response_1.successResponse)(transaction, undefined);
    }
    async createTransaction(data, userId) {
        // Verify the account exists and belongs to this user
        const account = await accounts_model_1.Account.findOne({
            where: { id: data.accountId, userId },
        });
        if (!account) {
            throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.ACCOUNT_NOT_FOUND, "Account not found.");
        }
        // Verify the transaction type exists
        const transactionType = await transaction_types_model_1.TransactionType.findByPk(data.transactionTypeId);
        if (!transactionType) {
            throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.NOT_FOUND, "Transaction type not found.");
        }
        const transaction = await transaction_repository_1.transactionRepository.create(data, userId);
        return (0, api_response_1.successResponse)(transaction, undefined);
    }
    async updateTransaction(id, userId, data) {
        const existing = await transaction_repository_1.transactionRepository.findById(id, userId);
        if (!existing) {
            throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.TRANSACTION_NOT_FOUND, "Transaction not found.");
        }
        // If switching account, verify new account belongs to user
        if (data.accountId) {
            const account = await accounts_model_1.Account.findOne({
                where: { id: data.accountId, userId },
            });
            if (!account) {
                throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.ACCOUNT_NOT_FOUND, "Account not found.");
            }
        }
        // If switching transaction type, verify it exists
        if (data.transactionTypeId) {
            const transactionType = await transaction_types_model_1.TransactionType.findByPk(data.transactionTypeId);
            if (!transactionType) {
                throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.NOT_FOUND, "Transaction type not found.");
            }
        }
        const updated = await transaction_repository_1.transactionRepository.update(id, userId, data);
        return (0, api_response_1.successResponse)(updated, undefined);
    }
    async deleteTransaction(id, userId) {
        const existing = await transaction_repository_1.transactionRepository.findById(id, userId);
        if (!existing) {
            throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.TRANSACTION_NOT_FOUND, "Transaction not found.");
        }
        await transaction_repository_1.transactionRepository.delete(id, userId);
        return (0, api_response_1.successResponse)(null, undefined);
    }
}
exports.transactionService = new TransactionService();
//# sourceMappingURL=transaction.service.js.map