import { Request, Response, NextFunction } from "express";

import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";

// ── Helpers ───────────────────────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Matches YYYY-MM-DD
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && DATE_RE.test(value) && !isNaN(Date.parse(value));
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && isFinite(value) && value > 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validationError(message: string): AppError {
  return new AppError(400, ERROR_CODES.VALIDATION_ERROR, message);
}

// ── Param validators ──────────────────────────────────────────────────────────

export function validateTransactionIdParam(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const { id } = req.params;

  if (!id) {
    return next(validationError("Transaction id is required."));
  }

  if (!isValidUuid(id)) {
    return next(validationError("Transaction id must be a valid UUID."));
  }

  next();
}

// ── Query validators ──────────────────────────────────────────────────────────

export function validateTransactionListQuery(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const { page, limit, accountId, transactionTypeId, startDate, endDate } =
    req.query as Record<string, string | undefined>;

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

  if (accountId !== undefined && !isValidUuid(accountId)) {
    return next(validationError("Query param 'accountId' must be a valid UUID."));
  }

  if (transactionTypeId !== undefined && !isValidUuid(transactionTypeId)) {
    return next(validationError("Query param 'transactionTypeId' must be a valid UUID."));
  }

  if (startDate !== undefined && !isValidDate(startDate)) {
    return next(validationError("Query param 'startDate' must be a valid date in YYYY-MM-DD format."));
  }

  if (endDate !== undefined && !isValidDate(endDate)) {
    return next(validationError("Query param 'endDate' must be a valid date in YYYY-MM-DD format."));
  }

  if (startDate && endDate && startDate > endDate) {
    return next(validationError("Query param 'startDate' must not be after 'endDate'."));
  }

  next();
}

// ── Body validators ───────────────────────────────────────────────────────────

export function validateCreateTransaction(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const { transactionDate, accountId, transactionTypeId, amount, paymentMethod, remarks, note } =
    req.body ?? {};

  if (!isValidDate(transactionDate)) {
    return next(
      validationError("Field 'transactionDate' is required and must be a valid date in YYYY-MM-DD format."),
    );
  }

  if (!isValidUuid(accountId)) {
    return next(validationError("Field 'accountId' is required and must be a valid UUID."));
  }

  if (!isValidUuid(transactionTypeId)) {
    return next(validationError("Field 'transactionTypeId' is required and must be a valid UUID."));
  }

  if (!isPositiveNumber(amount)) {
    return next(validationError("Field 'amount' is required and must be a positive number."));
  }

  if (paymentMethod !== undefined && !isNonEmptyString(paymentMethod)) {
    return next(validationError("Field 'paymentMethod' must be a non-empty string."));
  }

  if (remarks !== undefined && !isNonEmptyString(remarks)) {
    return next(validationError("Field 'remarks' must be a non-empty string."));
  }

  if (note !== undefined && !isNonEmptyString(note)) {
    return next(validationError("Field 'note' must be a non-empty string."));
  }

  next();
}

export function validateUpdateTransaction(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const { transactionDate, accountId, transactionTypeId, amount, paymentMethod, remarks, note } =
    req.body ?? {};

  const hasAtLeastOne = [
    transactionDate, accountId, transactionTypeId, amount, paymentMethod, remarks, note,
  ].some((v) => v !== undefined);

  if (!hasAtLeastOne) {
    return next(
      validationError(
        "Request body must include at least one of: 'transactionDate', 'accountId', 'transactionTypeId', 'amount', 'paymentMethod', 'remarks', 'note'.",
      ),
    );
  }

  if (transactionDate !== undefined && !isValidDate(transactionDate)) {
    return next(
      validationError("Field 'transactionDate' must be a valid date in YYYY-MM-DD format."),
    );
  }

  if (accountId !== undefined && !isValidUuid(accountId)) {
    return next(validationError("Field 'accountId' must be a valid UUID."));
  }

  if (transactionTypeId !== undefined && !isValidUuid(transactionTypeId)) {
    return next(validationError("Field 'transactionTypeId' must be a valid UUID."));
  }

  if (amount !== undefined && !isPositiveNumber(amount)) {
    return next(validationError("Field 'amount' must be a positive number."));
  }

  if (paymentMethod !== undefined && !isNonEmptyString(paymentMethod)) {
    return next(validationError("Field 'paymentMethod' must be a non-empty string."));
  }

  if (remarks !== undefined && !isNonEmptyString(remarks)) {
    return next(validationError("Field 'remarks' must be a non-empty string."));
  }

  if (note !== undefined && !isNonEmptyString(note)) {
    return next(validationError("Field 'note' must be a non-empty string."));
  }

  next();
}
