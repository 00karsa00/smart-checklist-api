"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const app_error_1 = require("../../common/errors/app.error");
const error_codes_1 = require("../../common/errors/error.codes");
const auth_controller_1 = require("./auth.controller");
const router = (0, express_1.Router)();
// ── Validators ────────────────────────────────────────────────────────────────
function validateGenerateTokenBody(req, _res, next) {
    const { userId } = req.body;
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
        return next(new app_error_1.AppError(400, error_codes_1.ERROR_CODES.VALIDATION_ERROR, "userId is required and must be a non-empty string"));
    }
    // Basic UUID v4 format check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId.trim())) {
        return next(new app_error_1.AppError(400, error_codes_1.ERROR_CODES.VALIDATION_ERROR, "userId must be a valid UUID v4"));
    }
    next();
}
function validateValidateTokenBody(req, _res, next) {
    const { token } = req.body;
    if (!token || typeof token !== "string" || token.trim() === "") {
        return next(new app_error_1.AppError(400, error_codes_1.ERROR_CODES.VALIDATION_ERROR, "token is required and must be a non-empty string"));
    }
    next();
}
// ── Routes ────────────────────────────────────────────────────────────────────
// POST /api/auth/token  — generate a JWT for a given userId
router.post("/token", validateGenerateTokenBody, auth_controller_1.generateToken);
// POST /api/auth/token/validate  — validate an existing JWT
router.post("/token/validate", validateValidateTokenBody, auth_controller_1.validateToken);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map