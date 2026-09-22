"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccounts = getAccounts;
exports.getAccount = getAccount;
exports.createAccount = createAccount;
exports.updateAccount = updateAccount;
exports.deleteAccount = deleteAccount;
require("../../common/types/request-context.type");
const account_service_1 = require("./account.service");
// ── Helpers ───────────────────────────────────────────────────────────────────
function withRequestId(response, req) {
    return { ...response, requestId: req.headers["x-request-id"] };
}
// ── Controllers ───────────────────────────────────────────────────────────────
async function getAccounts(req, res, next) {
    try {
        const userId = req.user.userId;
        const page = Math.max(1, parseInt(req.query.page ?? "1", 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "10", 10) || 10));
        const result = await account_service_1.accountService.getAllAccounts(userId, page, limit, {
            status: req.query.status,
            type: req.query.type,
            bank: req.query.bank,
            search: req.query.search,
        });
        res.status(200).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
async function getAccount(req, res, next) {
    try {
        const result = await account_service_1.accountService.getAccountById(req.params.id, req.user.userId);
        res.status(200).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
async function createAccount(req, res, next) {
    try {
        const result = await account_service_1.accountService.createAccount(req.body, req.user.userId);
        res.status(201).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
async function updateAccount(req, res, next) {
    try {
        const result = await account_service_1.accountService.updateAccount(req.params.id, req.user.userId, req.body);
        res.status(200).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
async function deleteAccount(req, res, next) {
    try {
        const result = await account_service_1.accountService.deleteAccount(req.params.id, req.user.userId);
        res.status(200).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=account.controller.js.map