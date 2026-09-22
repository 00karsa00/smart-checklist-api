"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountService = void 0;
const app_error_1 = require("../../common/errors/app.error");
const error_codes_1 = require("../../common/errors/error.codes");
const api_response_1 = require("../../common/responses/api-response");
const account_repository_1 = require("./account.repository");
const account_id_generator_1 = require("./account.id-generator");
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_ACCOUNT_ID_RETRIES = 5;
/**
 * Account business logic. Receives clean business parameters (`userId`,
 * `payload`) — never the Express request. Owns account-id generation, ownership
 * rules, the deletion strategy, and the rule that balance is not editable here.
 * Returns the shared ApiSuccessResponse envelope.
 */
class AccountService {
    async getAllAccounts(userId, page, limit, filters) {
        const safePage = page > 0 ? page : DEFAULT_PAGE;
        const safeLimit = limit > 0 ? limit : DEFAULT_LIMIT;
        const offset = (safePage - 1) * safeLimit;
        const { rows, count } = await account_repository_1.accountRepository.findAll(userId, offset, safeLimit, filters);
        const data = (0, api_response_1.buildPaginatedData)(rows, {
            page: safePage,
            limit: safeLimit,
            total: count,
        });
        return (0, api_response_1.successResponse)(data, undefined);
    }
    async getAccountById(id, userId) {
        const account = await account_repository_1.accountRepository.findById(id, userId);
        if (!account) {
            throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.ACCOUNT_NOT_FOUND, "Account not found.");
        }
        return (0, api_response_1.successResponse)(account, undefined);
    }
    async createAccount(data, userId) {
        // Prevent duplicate account numbers for the same user (when provided).
        if (data.accountNumber) {
            const existing = await account_repository_1.accountRepository.findByAccountNumber(data.accountNumber, userId);
            if (existing) {
                throw new app_error_1.AppError(409, error_codes_1.ERROR_CODES.ACCOUNT_ALREADY_EXISTS, "An account with this account number already exists.");
            }
        }
        const account = await this.createWithGeneratedId(data, userId);
        return (0, api_response_1.successResponse)(account, undefined);
    }
    async updateAccount(id, userId, data) {
        const existing = await account_repository_1.accountRepository.findById(id, userId);
        if (!existing) {
            throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.ACCOUNT_NOT_FOUND, "Account not found.");
        }
        // If changing account number, ensure it isn't taken by another account.
        if (data.accountNumber && data.accountNumber !== existing.accountNumber) {
            const duplicate = await account_repository_1.accountRepository.findByAccountNumber(data.accountNumber, userId);
            if (duplicate) {
                throw new app_error_1.AppError(409, error_codes_1.ERROR_CODES.ACCOUNT_ALREADY_EXISTS, "An account with this account number already exists.");
            }
        }
        const updated = await account_repository_1.accountRepository.update(id, userId, data);
        return (0, api_response_1.successResponse)(updated, undefined);
    }
    /**
     * Reusable deletion strategy: soft delete. Destructive deletion is refused
     * for accounts that are referenced by transactions; otherwise the account is
     * marked inactive so history and balances remain intact.
     */
    async deleteAccount(id, userId) {
        const existing = await account_repository_1.accountRepository.findById(id, userId);
        if (!existing) {
            throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.ACCOUNT_NOT_FOUND, "Account not found.");
        }
        const transactionCount = await account_repository_1.accountRepository.countTransactions(existing.id);
        if (transactionCount > 0) {
            throw new app_error_1.AppError(409, error_codes_1.ERROR_CODES.ACCOUNT_HAS_TRANSACTIONS, "This account has transactions and cannot be deleted. Deactivate it instead.");
        }
        await account_repository_1.accountRepository.softDelete(id, userId);
        return (0, api_response_1.successResponse)(null, undefined);
    }
    // ── Internals ─────────────────────────────────────────────────────────────
    /**
     * Generates the next per-user account id and creates the account, retrying a
     * few times if a concurrent create grabbed the same number (the composite
     * UNIQUE index is the source of truth).
     */
    async createWithGeneratedId(data, userId) {
        let lastError;
        for (let attempt = 0; attempt < MAX_ACCOUNT_ID_RETRIES; attempt += 1) {
            const latest = await account_repository_1.accountRepository.findLatestAccountId(userId);
            const accountId = (0, account_id_generator_1.nextAccountId)(latest);
            try {
                return (await account_repository_1.accountRepository.create(data, userId, accountId));
            }
            catch (error) {
                // Unique-violation on (user_id, account_id) → retry with a fresh number.
                if (isUniqueViolation(error)) {
                    lastError = error;
                    continue;
                }
                throw error;
            }
        }
        throw new app_error_1.AppError(500, error_codes_1.ERROR_CODES.DATABASE_ERROR, "Could not allocate a unique account id. Please retry.");
    }
}
function isUniqueViolation(error) {
    const name = error?.name;
    return name === "SequelizeUniqueConstraintError";
}
exports.accountService = new AccountService();
//# sourceMappingURL=account.service.js.map