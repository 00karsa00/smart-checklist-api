"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const app_error_1 = require("../../common/errors/app.error");
const error_codes_1 = require("../../common/errors/error.codes");
const api_response_1 = require("../../common/responses/api-response");
const user_repository_1 = require("./user.repository");
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
class UserService {
    async getAllUsers({ page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, } = {}) {
        const offset = (page - 1) * limit;
        const { rows, count } = await user_repository_1.userRepository.findAll(offset, limit);
        return (0, api_response_1.successResponse)(rows, undefined, {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        });
    }
    async getUserById(id) {
        const user = await user_repository_1.userRepository.findById(id);
        if (!user) {
            throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.USER_NOT_FOUND, "User not found");
        }
        return (0, api_response_1.successResponse)(user, undefined);
    }
    async createUser(data) {
        const existingUser = await user_repository_1.userRepository.findByEmail(data.email);
        if (existingUser) {
            throw new app_error_1.AppError(409, error_codes_1.ERROR_CODES.USER_ALREADY_EXISTS, "User with this email already exists");
        }
        const user = await user_repository_1.userRepository.create(data);
        return (0, api_response_1.successResponse)(user, undefined);
    }
    async updateUser(id, data) {
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
        const updated = (await user_repository_1.userRepository.update(id, data));
        return (0, api_response_1.successResponse)(updated, undefined);
    }
    async deleteUser(id) {
        const user = await user_repository_1.userRepository.findById(id);
        if (!user) {
            throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.USER_NOT_FOUND, "User not found");
        }
        await user_repository_1.userRepository.delete(id);
        return (0, api_response_1.successResponse)(null, undefined);
    }
}
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map