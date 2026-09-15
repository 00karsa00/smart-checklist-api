"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const app_error_1 = require("../errors/app.error");
const logger_1 = require("../../infrastructure/observability/logger/logger");
function errorMiddleware(error, req, res, _next) {
    const requestId = req.headers["x-request-id"];
    if (error instanceof app_error_1.AppError) {
        logger_1.logger.error(error.message, {
            requestId,
            code: error.code,
            statusCode: error.statusCode,
        });
        return res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
            },
            requestId,
        });
    }
    logger_1.logger.error("Unhandled application error", {
        requestId,
        error,
    });
    return res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal server error",
        },
        requestId,
    });
}
//# sourceMappingURL=error.middleware.js.map