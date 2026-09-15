"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_error_1 = require("../../common/errors/app.error");
const error_codes_1 = require("../../common/errors/error.codes");
const api_response_1 = require("../../common/responses/api-response");
const configuration_1 = require("../../config/configuration");
const auth_repository_1 = require("./auth.repository");
class AuthService {
    async generateToken(data) {
        const user = await auth_repository_1.authRepository.findById(data.userId);
        if (!user) {
            throw new app_error_1.AppError(404, error_codes_1.ERROR_CODES.USER_NOT_FOUND, `User with id '${data.userId}' not found or inactive`);
        }
        const payload = { sub: user.id };
        const accessToken = jsonwebtoken_1.default.sign(payload, configuration_1.configuration.jwt.secret, {
            expiresIn: configuration_1.configuration.jwt.expiresIn,
        });
        return (0, api_response_1.successResponse)({
            accessToken,
            tokenType: "Bearer",
            expiresIn: configuration_1.configuration.jwt.expiresIn,
            userId: user.id,
        }, undefined);
    }
    async validateToken(data) {
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(data.token, configuration_1.configuration.jwt.secret);
        }
        catch (err) {
            if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new app_error_1.AppError(401, error_codes_1.ERROR_CODES.TOKEN_EXPIRED, "Token has expired");
            }
            throw new app_error_1.AppError(401, error_codes_1.ERROR_CODES.UNAUTHORIZED, "Invalid token");
        }
        const userId = decoded.sub;
        const user = await auth_repository_1.authRepository.findById(userId);
        if (!user) {
            throw new app_error_1.AppError(401, error_codes_1.ERROR_CODES.UNAUTHORIZED, "Token is valid but the associated user no longer exists or is inactive");
        }
        return (0, api_response_1.successResponse)({
            valid: true,
            userId,
            issuedAt: new Date(decoded.iat * 1000),
            expiresAt: new Date(decoded.exp * 1000),
        }, undefined);
    }
}
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map