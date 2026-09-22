"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccountIdParam = validateAccountIdParam;
exports.validateAccountListQuery = validateAccountListQuery;
exports.validateCreateAccount = validateCreateAccount;
exports.validateUpdateAccount = validateUpdateAccount;
const app_error_1 = require("../../common/errors/app.error");
const error_codes_1 = require("../../common/errors/error.codes");
const accounts_model_1 = require("../../infrastructure/database/models/accounts.model");
// ── Helpers ───────────────────────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const VALID_ACCOUNT_TYPES = Object.values(accounts_model_1.AccountType);
const VALID_ACCOUNT_STATUSES = Object.values(accounts_model_1.AccountStatus);
function isValidUuid(value) {
    return typeof value === "string" && UUID_RE.test(value);
}
function isValidDate(value) {
    return typeof value === "string" && DATE_RE.test(value) && !isNaN(Date.parse(value));
}
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function isNonNegativeNumber(value) {
    return typeof value === "number" && isFinite(value) && value >= 0;
}
function validationError(message) {
    return new app_error_1.AppError(400, error_codes_1.ERROR_CODES.VALIDATION_ERROR, message);
}
// ── Param validators ──────────────────────────────────────────────────────────
function validateAccountIdParam(req, _res, next) {
    const { id } = req.params;
    if (!id) {
        return next(validationError("Account id is required."));
    }
    if (!isValidUuid(id)) {
        return next(validationError("Account id must be a valid UUID."));
    }
    next();
}
// ── Query validators ──────────────────────────────────────────────────────────
function validateAccountListQuery(req, _res, next) {
    const { page, limit, status, type } = req.query;
    if (page !== undefined) {
        const p = Number(page);
        if (!Number.isInteger(p) || p < 1) {
            return next(validationError("Query param 'page' must be a positive integer."));
        }
    }
    if (limit !== undefined) {
        const l = Number(limit);
        if (!Number.isInteger(l) || l < 1 || l > 100) {
            return next(validationError("Query param 'limit' must be an integer between 1 and 100."));
        }
    }
    if (status !== undefined && !VALID_ACCOUNT_STATUSES.includes(status)) {
        return next(new app_error_1.AppError(400, error_codes_1.ERROR_CODES.INVALID_ACCOUNT_STATUS, `Query param 'status' must be one of: ${VALID_ACCOUNT_STATUSES.join(", ")}.`));
    }
    if (type !== undefined && !VALID_ACCOUNT_TYPES.includes(type)) {
        return next(new app_error_1.AppError(400, error_codes_1.ERROR_CODES.INVALID_ACCOUNT_TYPE, `Query param 'type' must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}.`));
    }
    // 'bank' and 'search' are free-text filters — no format constraints.
    next();
}
// ── Body validators ───────────────────────────────────────────────────────────
function isNullableNonEmptyString(value) {
    return value === null || isNonEmptyString(value);
}
function isNullableDate(value) {
    return value === null || isValidDate(value);
}
function validateCreateAccount(req, _res, next) {
    const body = (req.body ?? {});
    const { accountName, bank, accountNumber, customerNumber, ifsc, type, status, openingDate, closingDate, currentBalance, } = body;
    // Ownership / identity fields must never be supplied by the client.
    for (const forbidden of ["id", "userId", "accountId"]) {
        if (body[forbidden] !== undefined) {
            return next(validationError(`Field '${forbidden}' cannot be set by the client.`));
        }
    }
    if (!isNonEmptyString(accountName)) {
        return next(validationError("Field 'accountName' is required and must be a non-empty string."));
    }
    if (!isNonEmptyString(bank)) {
        return next(validationError("Field 'bank' is required and must be a non-empty string."));
    }
    if (!VALID_ACCOUNT_TYPES.includes(type)) {
        return next(new app_error_1.AppError(400, error_codes_1.ERROR_CODES.INVALID_ACCOUNT_TYPE, `Field 'type' is required and must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}.`));
    }
    if (status !== undefined && !VALID_ACCOUNT_STATUSES.includes(status)) {
        return next(new app_error_1.AppError(400, error_codes_1.ERROR_CODES.INVALID_ACCOUNT_STATUS, `Field 'status' must be one of: ${VALID_ACCOUNT_STATUSES.join(", ")}.`));
    }
    if (accountNumber !== undefined && !isNullableNonEmptyString(accountNumber)) {
        return next(validationError("Field 'accountNumber' must be a non-empty string or null."));
    }
    if (customerNumber !== undefined && !isNullableNonEmptyString(customerNumber)) {
        return next(validationError("Field 'customerNumber' must be a non-empty string or null."));
    }
    if (ifsc !== undefined && !isNullableNonEmptyString(ifsc)) {
        return next(validationError("Field 'ifsc' must be a non-empty string or null."));
    }
    if (openingDate !== undefined && !isNullableDate(openingDate)) {
        return next(validationError("Field 'openingDate' must be a valid date in YYYY-MM-DD format or null."));
    }
    if (closingDate !== undefined && !isNullableDate(closingDate)) {
        return next(validationError("Field 'closingDate' must be a valid date in YYYY-MM-DD format or null."));
    }
    if (currentBalance !== undefined && !isNonNegativeNumber(currentBalance)) {
        return next(validationError("Field 'currentBalance' must be a non-negative number."));
    }
    // ── Normalisation ─────────────────────────────────────────────────────────
    if (typeof ifsc === "string")
        req.body.ifsc = ifsc.trim().toUpperCase();
    if (typeof type === "string")
        req.body.type = type.trim().toLowerCase();
    if (typeof status === "string")
        req.body.status = status.trim().toLowerCase();
    next();
}
function validateUpdateAccount(req, _res, next) {
    const body = (req.body ?? {});
    const { accountName, bank, accountNumber, customerNumber, ifsc, type, status, openingDate, closingDate, } = body;
    // Immutable / owner fields cannot be changed through the update API.
    for (const forbidden of ["id", "userId", "accountId", "currentBalance"]) {
        if (body[forbidden] !== undefined) {
            return next(validationError(`Field '${forbidden}' cannot be updated through this endpoint.`));
        }
    }
    const hasAtLeastOne = [
        accountName, bank, accountNumber, customerNumber, ifsc,
        type, status, openingDate, closingDate,
    ].some((v) => v !== undefined);
    if (!hasAtLeastOne) {
        return next(validationError("Request body must include at least one of: 'accountName', 'bank', 'accountNumber', 'customerNumber', 'ifsc', 'type', 'status', 'openingDate', 'closingDate'."));
    }
    if (accountName !== undefined && !isNonEmptyString(accountName)) {
        return next(validationError("Field 'accountName' must be a non-empty string."));
    }
    if (bank !== undefined && !isNonEmptyString(bank)) {
        return next(validationError("Field 'bank' must be a non-empty string."));
    }
    if (accountNumber !== undefined && !isNullableNonEmptyString(accountNumber)) {
        return next(validationError("Field 'accountNumber' must be a non-empty string or null."));
    }
    if (customerNumber !== undefined && !isNullableNonEmptyString(customerNumber)) {
        return next(validationError("Field 'customerNumber' must be a non-empty string or null."));
    }
    if (ifsc !== undefined && !isNullableNonEmptyString(ifsc)) {
        return next(validationError("Field 'ifsc' must be a non-empty string or null."));
    }
    if (type !== undefined && !VALID_ACCOUNT_TYPES.includes(type)) {
        return next(new app_error_1.AppError(400, error_codes_1.ERROR_CODES.INVALID_ACCOUNT_TYPE, `Field 'type' must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}.`));
    }
    if (status !== undefined && !VALID_ACCOUNT_STATUSES.includes(status)) {
        return next(new app_error_1.AppError(400, error_codes_1.ERROR_CODES.INVALID_ACCOUNT_STATUS, `Field 'status' must be one of: ${VALID_ACCOUNT_STATUSES.join(", ")}.`));
    }
    if (openingDate !== undefined && !isNullableDate(openingDate)) {
        return next(validationError("Field 'openingDate' must be a valid date in YYYY-MM-DD format or null."));
    }
    if (closingDate !== undefined && !isNullableDate(closingDate)) {
        return next(validationError("Field 'closingDate' must be a valid date in YYYY-MM-DD format or null."));
    }
    if (typeof openingDate === "string" &&
        typeof closingDate === "string" &&
        openingDate > closingDate) {
        return next(validationError("Field 'openingDate' must not be after 'closingDate'."));
    }
    // ── Normalisation ─────────────────────────────────────────────────────────
    if (typeof ifsc === "string")
        req.body.ifsc = ifsc.trim().toUpperCase();
    if (typeof type === "string")
        req.body.type = type.trim().toLowerCase();
    if (typeof status === "string")
        req.body.status = status.trim().toLowerCase();
    next();
}
//# sourceMappingURL=account.validator.js.map