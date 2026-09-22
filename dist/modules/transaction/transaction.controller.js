"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = getTransactions;
exports.getTransaction = getTransaction;
exports.createTransaction = createTransaction;
exports.updateTransaction = updateTransaction;
exports.deleteTransaction = deleteTransaction;
require("../../common/types/request-context.type");
const transaction_service_1 = require("./transaction.service");
// ── Helpers ───────────────────────────────────────────────────────────────────
function withRequestId(response, req) {
    return { ...response, requestId: req.headers["x-request-id"] };
}
// ── Controllers ───────────────────────────────────────────────────────────────
async function getTransactions(req, res, next) {
    try {
        const userId = req.user.userId;
        const page = Math.max(1, parseInt(req.query.page ?? "1", 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "10", 10) || 10));
        const result = await transaction_service_1.transactionService.getAllTransactions(userId, page, limit, {
            accountId: req.query.accountId,
            transactionTypeId: req.query.transactionTypeId,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
        });
        res.status(200).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
async function getTransaction(req, res, next) {
    try {
        const result = await transaction_service_1.transactionService.getTransactionById(req.params.id, req.user.userId);
        res.status(200).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
async function createTransaction(req, res, next) {
    try {
        const result = await transaction_service_1.transactionService.createTransaction(req.body, req.user.userId);
        res.status(201).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
async function updateTransaction(req, res, next) {
    try {
        const result = await transaction_service_1.transactionService.updateTransaction(req.params.id, req.user.userId, req.body);
        res.status(200).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
async function deleteTransaction(req, res, next) {
    try {
        const result = await transaction_service_1.transactionService.deleteTransaction(req.params.id, req.user.userId);
        res.status(200).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=transaction.controller.js.map