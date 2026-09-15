"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.validateToken = validateToken;
const auth_service_1 = require("./auth.service");
// ── Helpers ───────────────────────────────────────────────────────────────────
function withRequestId(response, req) {
    return { ...response, requestId: req.headers["x-request-id"] };
}
// ── Controllers ───────────────────────────────────────────────────────────────
async function generateToken(req, res, next) {
    try {
        const result = await auth_service_1.authService.generateToken(req.body);
        res.status(201).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
async function validateToken(req, res, next) {
    try {
        const result = await auth_service_1.authService.validateToken(req.body);
        res.status(200).json(withRequestId(result, req));
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=auth.controller.js.map