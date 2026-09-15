"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
function successResponse(data, requestId, meta = null) {
    return {
        success: true,
        data,
        meta,
        requestId,
    };
}
//# sourceMappingURL=api-response.js.map