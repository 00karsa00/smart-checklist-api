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
      new AppError(
        400,
        ERROR_CODES.INVALID_ACCOUNT_STATUS,
        `Query param 'status' must be one of: ${VALID_ACCOUNT_STATUSES.join(", ")}.`,
      ),
    );
  }

  if (type !== undefined && !VALID_ACCOUNT_TYPES.includes(type)) {
    return next(
      new AppError(
        400,
        ERROR_CODES.INVALID_ACCOUNT_TYPE,
        `Query param 'type' must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}.`,
      ),
    );
  }

  // 'bank' and 'search' are free-text filters — no format constraints.

  next();
}

// ── Body validators ───────────────────────────────────────────────────────────

function isNullableNonEmptyString(value: unknown): boolean {
  return value === null || isNonEmptyString(value);
}

function isNullableDate(value: unknown): boolean {
  return value === null || isValidDate(value);
}

export function validateCreateAccount(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const {
    accountName, bank, accountNumber, customerNumber, ifsc,
    type, status, openingDate, closingDate, currentBalance,
  } = body;

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

  if (!VALID_ACCOUNT_TYPES.includes(type as string)) {
    return next(
      new AppError(
        400,
        ERROR_CODES.INVALID_ACCOUNT_TYPE,
        `Field 'type' is required and must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}.`,
      ),
    );
  }

  if (status !== undefined && !VALID_ACCOUNT_STATUSES.includes(status as string)) {
    return next(
      new AppError(
        400,
        ERROR_CODES.INVALID_ACCOUNT_STATUS,
        `Field 'status' must be one of: ${VALID_ACCOUNT_STATUSES.join(", ")}.`,
      ),
    );
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
    return next(
      validationError("Field 'openingDate' must be a valid date in YYYY-MM-DD format or null."),
    );
  }

  if (closingDate !== undefined && !isNullableDate(closingDate)) {
    return next(
      validationError("Field 'closingDate' must be a valid date in YYYY-MM-DD format or null."),
    );
  }

  if (currentBalance !== undefined && !isNonNegativeNumber(currentBalance)) {
    return next(validationError("Field 'currentBalance' must be a non-negative number."));
  }

  // ── Normalisation ─────────────────────────────────────────────────────────
  if (typeof ifsc === "string") req.body.ifsc = ifsc.trim().toUpperCase();
  if (typeof type === "string") req.body.type = type.trim().toLowerCase();
  if (typeof status === "string") req.body.status = status.trim().toLowerCase();

  next();
}

export function validateUpdateAccount(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const {
    accountName, bank, accountNumber, customerNumber, ifsc,
    type, status, openingDate, closingDate,
  } = body;

  // Immutable / owner fields cannot be changed through the update API.
  for (const forbidden of ["id", "userId", "accountId", "currentBalance"]) {
    if (body[forbidden] !== undefined) {
      return next(
        validationError(
          `Field '${forbidden}' cannot be updated through this endpoint.`,
        ),
      );
    }
  }

  const hasAtLeastOne = [
    accountName, bank, accountNumber, customerNumber, ifsc,
    type, status, openingDate, closingDate,
  ].some((v) => v !== undefined);

  if (!hasAtLeastOne) {
    return next(
      validationError(
        "Request body must include at least one of: 'accountName', 'bank', 'accountNumber', 'customerNumber', 'ifsc', 'type', 'status', 'openingDate', 'closingDate'.",
      ),
    );
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

  if (type !== undefined && !VALID_ACCOUNT_TYPES.includes(type as string)) {
    return next(
      new AppError(
        400,
        ERROR_CODES.INVALID_ACCOUNT_TYPE,
        `Field 'type' must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}.`,
      ),
    );
  }

  if (status !== undefined && !VALID_ACCOUNT_STATUSES.includes(status as string)) {
    return next(
      new AppError(
        400,
        ERROR_CODES.INVALID_ACCOUNT_STATUS,
        `Field 'status' must be one of: ${VALID_ACCOUNT_STATUSES.join(", ")}.`,
      ),
    );
  }

  if (openingDate !== undefined && !isNullableDate(openingDate)) {
    return next(validationError("Field 'openingDate' must be a valid date in YYYY-MM-DD format or null."));
  }

  if (closingDate !== undefined && !isNullableDate(closingDate)) {
    return next(validationError("Field 'closingDate' must be a valid date in YYYY-MM-DD format or null."));
  }

  if (
    typeof openingDate === "string" &&
    typeof closingDate === "string" &&
    openingDate > closingDate
  ) {
    return next(validationError("Field 'openingDate' must not be after 'closingDate'."));
  }

  // ── Normalisation ─────────────────────────────────────────────────────────
  if (typeof ifsc === "string") req.body.ifsc = ifsc.trim().toUpperCase();
  if (typeof type === "string") req.body.type = type.trim().toLowerCase();
  if (typeof status === "string") req.body.status = status.trim().toLowerCase();

  next();
}
