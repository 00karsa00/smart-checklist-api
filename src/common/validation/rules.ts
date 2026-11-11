import { Guard } from "../../infrastructure/http";
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

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && isFinite(value) && value > 0;
}

export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && isFinite(value) && value >= 0;
}

/** A whole number from `min` to `max`, inclusive. */
export function isIntegerBetween(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
}

// Built-in Intl lists, so codes stay in step with the runtime's ICU data.
const CURRENCIES = new Set(Intl.supportedValuesOf("currency"));

/** A colour as #RRGGBB. */
export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

/** An ISO 4217 currency code in upper case, e.g. "INR". */
export function isCurrencyCode(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{3}$/.test(value) && CURRENCIES.has(value);
}

/**
 * An IANA time zone name, e.g. "Asia/Kolkata". Any name the runtime can use is
 * accepted, older spellings too: Node and browsers list some zones under one
 * name only ("Asia/Calcutta"), so checking against that list refused the
 * default zone. Offsets such as "+05:30" are not names and are refused.
 */
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(value)) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

// Language, optional script, optional region: "en", "en-IN", "zh-Hant-TW", "es-419".
const LOCALE_RE = /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-([A-Z]{2}|\d{3}))?$/;

/** A language tag such as "en-IN", in canonical form. */
export function isLocaleTag(value: unknown): value is string {
  if (typeof value !== "string" || !LOCALE_RE.test(value)) return false;
  try {
    return Intl.getCanonicalLocales(value)[0] === value;
  } catch {
    return false;
  }
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

/** Accept null as well as values that pass `check`. */
export function orNull(check: (value: unknown) => boolean) {
  return (value: unknown): boolean => value === null || check(value);
}

/** Guard for `/:id` routes, e.g. idParamGuard("Account"). */
export function idParamGuard(entity: string): Guard {
  return (ctx) => {
    const { id } = ctx.params;

    if (!id) throw validationError(`${entity} id is required.`);
    if (!isUuid(id)) throw validationError(`${entity} id must be a valid UUID.`);
  };
}

/** Throw when none of `fields` is present (for partial updates). */
export function assertAtLeastOne(body: Record<string, unknown>, fields: readonly string[]): void {
  if (!fields.some((field) => body[field] !== undefined)) {
    throw validationError(
      `Request body must include at least one of: ${fields.map((f) => `'${f}'`).join(", ")}.`,
    );
  }
}

/** Throw on the first of `fields` the client sent but may not set. */
export function rejectFields(
  body: Record<string, unknown>,
  fields: readonly string[],
  message: (field: string) => string,
): void {
  for (const field of fields) {
    if (body[field] !== undefined) throw validationError(message(field));
  }
}

/** Require `body[field]` as non-empty text of at most `maxLength`, trimmed in place. */
export function assertRequiredText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number,
): void {
  const value = body[field];
  if (!isNonEmptyString(value)) {
    throw validationError(`Field '${field}' is required and must be a non-empty string.`);
  }
  body[field] = value.trim();
  if ((body[field] as string).length > maxLength) {
    throw validationError(`Field '${field}' must not exceed ${maxLength} characters.`);
  }
}

/**
 * Optional text: trimmed in place; "" or null (or only spaces) becomes null.
 * With `maxLength`, longer text is refused.
 */
export function normaliseOptionalText(
  body: Record<string, unknown>,
  field: string,
  maxLength?: number,
): void {
  const value = body[field];
  if (value === undefined) return;
  if (value === null || value === "") {
    body[field] = null;
    return;
  }
  if (typeof value !== "string") throw validationError(`Field '${field}' must be text.`);
  const text = value.trim();
  if (maxLength !== undefined && text.length > maxLength) {
    throw validationError(`Field '${field}' must not exceed ${maxLength} characters.`);
  }
  body[field] = text || null;
}

/** Optional colour: "" or null clears it; otherwise #RRGGBB, stored upper-case. */
export function assertOptionalColor(body: Record<string, unknown>, field = "color"): void {
  normaliseOptionalText(body, field);
  if (typeof body[field] === "string") body[field] = (body[field] as string).toUpperCase();
  assertOptional(
    body,
    field,
    (value) => value === null || isHexColor(value),
    `Field '${field}' must look like #1E88E5.`,
  );
}

/** An optional "true"/"false" query parameter. */
export function assertOptionalBooleanQuery(query: Record<string, unknown>, field: string): void {
  assertOptional(
    query,
    field,
    (value) => value === "true" || value === "false",
    `Query param '${field}' must be true or false.`,
  );
}

/** Throw on the first field the client sent that is not in `allowed`. */
export function rejectUnknownFields(
  body: Record<string, unknown>,
  allowed: readonly string[],
  message: (field: string) => string,
): void {
  rejectFields(
    body,
    Object.keys(body).filter((field) => !allowed.includes(field)),
    message,
  );
}

/** Throw `message` when `field` is present but fails `check`. Absent fields pass. */
export function assertOptional(
  body: Record<string, unknown>,
  field: string,
  check: (value: unknown) => boolean,
  message: string,
): void {
  if (body[field] !== undefined && !check(body[field])) throw validationError(message);
}
