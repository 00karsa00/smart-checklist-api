import { Request, Response, NextFunction } from "express";

import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { AccountType, AccountStatus } from "../../infrastructure/database/models/accounts.model";

// ── Helpers ───────────────────────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const VALID_ACCOUNT_TYPES = Object.values(AccountType) as string[];
const VALID_ACCOUNT_STATUSES = Object.values(AccountStatus) as string[];

function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && DATE_RE.test(value) && !isNaN(Date.parse(value));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && isFinite(value) && value >= 0;
}

function validationError(message: string): AppError {
  return new AppError(400, ERROR_CODES.VALIDATION_ERROR, message);
}

// ── Param validators ──────────────────────────────────────────────────────────

export function validateAccountIdParam(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
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

export function validateAccountListQuery(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const { page, limit, status, type } = req.query as Record<string, string | undefined>;

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
    return next(
      validationError(`Query param 'status' must be one of: ${VALID_ACCOUNT_STATUSES.join(", ")}.`),
    );
  }

  if (type !== undefined && !VALID_ACCOUNT_TYPES.includes(type)) {
    return next(
      validationError(`Query param 'type' must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}.`),
    );
  }

  next();
}

// ── Body validators ───────────────────────────────────────────────────────────

export function validateCreateAccount(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const { accountName, bank, accountNumber, customerNumber, ifsc, type, openingDate, currentBalance } =
    req.body ?? {};

  if (!isNonEmptyString(accountName)) {
    return next(validationError("Field 'accountName' is required and must be a non-empty string."));
  }

  if (!isNonEmptyString(bank)) {
    return next(validationError("Field 'bank' is required and must be a non-empty string."));
  }

  if (!isNonEmptyString(accountNumber)) {
    return next(validationError("Field 'accountNumber' is required and must be a non-empty string."));
  }

  if (!VALID_ACCOUNT_TYPES.includes(type)) {
    return next(
      validationError(`Field 'type' is required and must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}.`),
    );
  }

  if (!isValidDate(openingDate)) {
    return next(
      validationError("Field 'openingDate' is required and must be a valid date in YYYY-MM-DD format."),
    );
  }

  if (customerNumber !== undefined && !isNonEmptyString(customerNumber)) {
    return next(validationError("Field 'customerNumber' must be a non-empty string."));
  }

  if (ifsc !== undefined && !isNonEmptyString(ifsc)) {
    return next(validationError("Field 'ifsc' must be a non-empty string."));
  }

  if (currentBalance !== undefined && !isNonNegativeNumber(currentBalance)) {
    return next(validationError("Field 'currentBalance' must be a non-negative number."));
  }

  next();
}

export function validateUpdateAccount(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const {
    accountName, bank, accountNumber, customerNumber, ifsc,
    type, status, openingDate, closingDate, currentBalance,
  } = req.body ?? {};

  const hasAtLeastOne = [
    accountName, bank, accountNumber, customerNumber, ifsc,
    type, status, openingDate, closingDate, currentBalance,
  ].some((v) => v !== undefined);

  if (!hasAtLeastOne) {
    return next(
      validationError(
        "Request body must include at least one of: 'accountName', 'bank', 'accountNumber', 'customerNumber', 'ifsc', 'type', 'status', 'openingDate', 'closingDate', 'currentBalance'.",
      ),
    );
  }

  if (accountName !== undefined && !isNonEmptyString(accountName)) {
    return next(validationError("Field 'accountName' must be a non-empty string."));
  }

  if (bank !== undefined && !isNonEmptyString(bank)) {
    return next(validationError("Field 'bank' must be a non-empty string."));
  }

  if (accountNumber !== undefined && !isNonEmptyString(accountNumber)) {
    return next(validationError("Field 'accountNumber' must be a non-empty string."));
  }

  if (customerNumber !== undefined && !isNonEmptyString(customerNumber)) {
    return next(validationError("Field 'customerNumber' must be a non-empty string."));
  }

  if (ifsc !== undefined && !isNonEmptyString(ifsc)) {
    return next(validationError("Field 'ifsc' must be a non-empty string."));
  }

  if (type !== undefined && !VALID_ACCOUNT_TYPES.includes(type)) {
    return next(
      validationError(`Field 'type' must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}.`),
    );
  }

  if (status !== undefined && !VALID_ACCOUNT_STATUSES.includes(status)) {
    return next(
      validationError(`Field 'status' must be one of: ${VALID_ACCOUNT_STATUSES.join(", ")}.`),
    );
  }

  if (openingDate !== undefined && !isValidDate(openingDate)) {
    return next(validationError("Field 'openingDate' must be a valid date in YYYY-MM-DD format."));
  }

  if (closingDate !== undefined && !isValidDate(closingDate)) {
    return next(validationError("Field 'closingDate' must be a valid date in YYYY-MM-DD format."));
  }

  if (openingDate && closingDate && openingDate > closingDate) {
    return next(validationError("Field 'openingDate' must not be after 'closingDate'."));
  }

  if (currentBalance !== undefined && !isNonNegativeNumber(currentBalance)) {
    return next(validationError("Field 'currentBalance' must be a non-negative number."));
  }

  next();
}
