"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = errorResponse;
function errorResponse(code, message, requestId, details = null) {
    return {
        success: false,
        data: null,
        error: {
            code,
            message,
            details,
        },
        requestId,
    };
}
//# sourceMappingURL=api-error-response.js.map