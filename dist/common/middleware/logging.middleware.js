"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingMiddleware = loggingMiddleware;
const logger_1 = require("../../infrastructure/observability/logger/logger");
function loggingMiddleware(req, res, next) {
    const startTime = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - startTime;
        logger_1.logger.info("HTTP Request", {
            requestId: req.headers["x-request-id"],
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: duration,
        });
    });
    next();
}
//# sourceMappingURL=logging.middleware.js.map