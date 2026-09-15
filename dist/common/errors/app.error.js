"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = "AppError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=app.error.js.map