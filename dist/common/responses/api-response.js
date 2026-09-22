"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginatedData = buildPaginatedData;
exports.successResponse = successResponse;
function buildPaginatedData(items, args) {
    const { page, limit, total } = args;
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
function successResponse(data, requestId, meta = null) {
    return {
        success: true,
        data,
        meta,
        requestId,
    };
}
//# sourceMappingURL=api-response.js.map