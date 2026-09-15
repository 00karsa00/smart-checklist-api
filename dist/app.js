"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const configuration_1 = require("./config/configuration");
const request_id_middleware_1 = require("./common/middleware/request-id.middleware");
const logging_middleware_1 = require("./common/middleware/logging.middleware");
const error_middleware_1 = require("./common/middleware/error.middleware");
const app_error_1 = require("./common/errors/app.error");
const error_codes_1 = require("./common/errors/error.codes");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("./modules/user/user.routes"));
const app = (0, express_1.default)();
app.disable("x-powered-by");
app.use((0, cors_1.default)({
    origin: configuration_1.configuration.app.corsOrigin,
    credentials: true,
}));
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(request_id_middleware_1.requestIdMiddleware);
app.use(logging_middleware_1.loggingMiddleware);
app.get(`${configuration_1.configuration.app.apiPrefix}/health`, (_req, res) => {
    res.status(200).json({
        success: true,
        data: {
            status: "ok",
            service: "personal-finance-backend",
            timestamp: new Date().toISOString(),
        },
    });
});
app.use(`${configuration_1.configuration.app.apiPrefix}/auth`, auth_routes_1.default);
app.use(`${configuration_1.configuration.app.apiPrefix}/users`, user_routes_1.default);
// 404 handler
app.use((req, _res, next) => {
    next(new app_error_1.AppError(404, error_codes_1.ERROR_CODES.NOT_FOUND, `Route ${req.method} ${req.originalUrl} not found`));
});
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
//# sourceMappingURL=app.js.map