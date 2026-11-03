import { AppError } from "../errors/app.error";
import { ERROR_CODES } from "../errors/error.codes";
import { MAX_PAGE_LIMIT } from "../pagination";

// Reusable checks for module validators. Each is a type guard so the value is
// narrowed after a successful check.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function isUuidV4(value: unknown): value is string {
  return typeof value === "string" && UUID_V4_RE.test(value);
}

/** A real calendar date in YYYY-MM-DD form. */
export function isDate(value: unknown): value is string {
  return typeof value === "string" && DATE_RE.test(value) && !isNaN(Date.parse(value));
}

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_RE.test(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && isFinite(value) && value > 0;
}

export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && isFinite(value) && value >= 0;
}

export function isOneOf(value: unknown, allowed: readonly string[]): value is string {
  return typeof value === "string" && allowed.includes(value);
}

export function validationError(message: string): AppError {
  return new AppError(400, ERROR_CODES.VALIDATION_ERROR, message);
}

/** Shared ?page= / ?limit= validation for list endpoints. */
export function assertPageQuery(query: { page?: string; limit?: string }): void {
  if (query.page !== undefined) {
    const page = Number(query.page);
    if (!Number.isInteger(page) || page < 1) {
      throw validationError("Query param 'page' must be a positive integer.");
    }
  }

  if (query.limit !== undefined) {
    const limit = Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_LIMIT) {
      throw validationError(
        `Query param 'limit' must be an integer between 1 and ${MAX_PAGE_LIMIT}.`,
      );
    }
  }
}
