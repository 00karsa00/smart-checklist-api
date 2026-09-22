"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUser = getUser;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const app_error_1 = require("../../common/errors/app.error");
const error_codes_1 = require("../../common/errors/error.codes");
const user_repository_1 = require("./user.repository");
// ── Response helpers ────────────────────────────────────────────────────────
/** Build a successful response envelope with a consistent structure. */
function successResponse(data, meta = {}) {
    return { success: true, data, meta };
}
/** Build the common paginated `data` block. */
function buildPaginatedData(items, { page, limit, total }) {
    return {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 0,
        },
    };
}
/** Extract the common `meta` block from the incoming request. */
function buildMeta(req) {
    return { requestId: req.headers["x-request-id"] };
}
// ══════════════════════════════════════════════════════════════════════════════
// User service (pure business logic)
// ══════════════════════════════════════════════════════════════════════════════
//
// Design rules:
//  - Every method takes a single plain payload object.
//  - No knowledge of HTTP, Express, auth, or request context lives here.
//  - Methods return plain business data (entities / paginated data), never the
//    transport-level ApiResponse envelope.
//
// This keeps the service easy to unit test, reuse, and replace.
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
class UserService {
    async listUsers(payload = {}) {
        const page = payload.page ?? DEFAULT_PAGE;
        const limit = payload.limit ?? DEFAULT_LIMIT;
        const offset = (page - 1) * limit;
        const { rows, count } = await user_repository_1.userRepository.findAll(offset, limit);
        return buildPaginatedData(rows, { page, limit, total: count });
    }
    async getUserById(payload) {
        const user = await user_repository_1.userRepository.findById(payload.id);
        if (!user) {
            throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.USER_NOT_FOUND, "User not found");
        }
        return user;
    }
    async createUser(payload) {
        const existingUser = await user_repository_1.userRepository.findByEmail(payload.email);
        if (existingUser) {
            throw new app_error_1.AppError(409, error_codes_1.ERROR_CODES.USER_ALREADY_EXISTS, "User with this email already exists");
        }
        return user_repository_1.userRepository.create(payload);
    }
    async updateUser(payload) {
        const { id, data } = payload;
        const user = await user_repository_1.userRepository.findById(id);
        if (!user) {
            throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.USER_NOT_FOUND, "User not found");
        }
        if (data.email) {
            const existingUser = await user_repository_1.userRepository.findByEmail(data.email);
            if (existingUser && existingUser.id !== id) {
                throw new app_error_1.AppError(409, error_codes_1.ERROR_CODES.USER_ALREADY_EXISTS, "User with this email already exists");
            }
        }
        return (await user_repository_1.userRepository.update(id, data));
    }
    async deleteUser(payload) {
        const user = await user_repository_1.userRepository.findById(payload.id);
        if (!user) {
            throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.USER_NOT_FOUND, "User not found");
        }
        await user_repository_1.userRepository.delete(payload.id);
        return null;
    }
}
const userService = new UserService();
// ══════════════════════════════════════════════════════════════════════════════
// Controllers
// ══════════════════════════════════════════════════════════════════════════════
//
// Controllers own the HTTP layer: they parse/validate transport input, call the
// service with a plain payload object (no auth / request data), and wrap the
// pure business result in the common ApiResponse envelope.
async function getUsers(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page ?? "1", 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "10", 10) || 10));
        const data = await userService.listUsers({ page, limit });
        res.status(200).json(successResponse(data, buildMeta(req)));
    }
    catch (error) {
        next(error);
    }
}
async function getUser(req, res, next) {
    try {
        const data = await userService.getUserById({ id: req.params.id });
        res.status(200).json(successResponse(data, buildMeta(req)));
    }
    catch (error) {
        next(error);
    }
}
async function createUser(req, res, next) {
    try {
        const data = await userService.createUser(req.body);
        res.status(201).json(successResponse(data, buildMeta(req)));
    }
    catch (error) {
        next(error);
    }
}
async function updateUser(req, res, next) {
    try {
        const data = await userService.updateUser({ id: req.params.id, data: req.body });
        res.status(200).json(successResponse(data, buildMeta(req)));
    }
    catch (error) {
        next(error);
    }
}
async function deleteUser(req, res, next) {
    try {
        const data = await userService.deleteUser({ id: req.params.id });
        res.status(200).json(successResponse(data, buildMeta(req)));
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=user.controller.js.map