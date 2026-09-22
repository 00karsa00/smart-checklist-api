"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const configuration_1 = require("../../config/configuration");
const app_error_1 = require("../errors/app.error");
const error_codes_1 = require("../errors/error.codes");
require("../../common/types/request-context.type");
function authMiddleware(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new app_error_1.AppError(401, error_codes_1.ERROR_CODES.UNAUTHORIZED, "Authorization token is required."));
    }
    const token = authHeader.slice(7); // strip "Bearer "
    try {
        const decoded = jsonwebtoken_1.default.verify(token, configuration_1.configuration.jwt.secret);
        req.user = { userId: decoded.sub };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new app_error_1.AppError(401, error_codes_1.ERROR_CODES.TOKEN_EXPIRED, "Token has expired."));
        }
        return next(new app_error_1.AppError(401, error_codes_1.ERROR_CODES.UNAUTHORIZED, "Invalid token."));
    }
}
//# sourceMappingURL=auth.middleware.js.map