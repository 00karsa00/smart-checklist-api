"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUser = getUser;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const user_service_1 = require("./user.service");
// ── Helpers ───────────────────────────────────────────────────────────────────
function withRequestId(response, req) {
    return { ...response, requestId: req.headers["x-request-id"] };
}
// ── Controllers ───────────────────────────────────────────────────────────────
async function getUsers(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page ?? "1", 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "10", 10) || 10));
        const result = await user_service_1.userService.getAllUsers({ page, limit });
        res.status(200).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
async function getUser(req, res, next) {
    try {
        const result = await user_service_1.userService.getUserById(req.params.id);
        res.status(200).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
async function createUser(req, res, next) {
    try {
        const result = await user_service_1.userService.createUser(req.body);
        res.status(201).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
async function updateUser(req, res, next) {
    try {
        const result = await user_service_1.userService.updateUser(req.params.id, req.body);
        res.status(200).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
async function deleteUser(req, res, next) {
    try {
        const result = await user_service_1.userService.deleteUser(req.params.id);
        res.status(200).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=user.controller.js.map