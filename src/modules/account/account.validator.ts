import { AccountStatus, AccountType } from "../../common/enums/account.enum";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import {
  assertAtLeastOne,
  assertOptional,
  assertPageQuery,
  idParamGuard,
  isDate,
  isNonEmptyString,
  isNonNegativeNumber,
  isOneOf,
  orNull,
  rejectFields,
  validationError,
} from "../../common/validation/rules";
import { Guard } from "../../infrastructure/http";

const VALID_ACCOUNT_TYPES = Object.values(AccountType) as string[];
const VALID_ACCOUNT_STATUSES = Object.values(AccountStatus) as string[];

const UPDATABLE_FIELDS = [
  "accountName",
  "bank",
  "accountNumber",
  "customerNumber",
  "ifsc",
  "type",
  "status",
  "openingDate",
  "closingDate",
] as const;

function assertType(type: unknown, label: string): void {
  if (!isOneOf(type, VALID_ACCOUNT_TYPES)) {
    throw new AppError(
      400,
      ERROR_CODES.INVALID_ACCOUNT_TYPE,
      `${label} must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}.`,
    );
  }
}

function assertStatus(status: unknown, label: string): void {
  if (!isOneOf(status, VALID_ACCOUNT_STATUSES)) {
    throw new AppError(
      400,
      ERROR_CODES.INVALID_ACCOUNT_STATUS,
      `${label} must be one of: ${VALID_ACCOUNT_STATUSES.join(", ")}.`,
    );
  }
}

/** Optional bank identifiers, shared by create and update. */
function assertIdentifiers(body: Record<string, unknown>): void {
  for (const field of ["accountNumber", "customerNumber", "ifsc"]) {
    assertOptional(
      body,
      field,
      orNull(isNonEmptyString),
      `Field '${field}' must be a non-empty string or null.`,
    );
  }
}

/** Optional opening/closing dates, shared by create and update. */
function assertDates(body: Record<string, unknown>): void {
  for (const field of ["openingDate", "closingDate"]) {
    assertOptional(
      body,
      field,
      orNull(isDate),
      `Field '${field}' must be a valid date in YYYY-MM-DD format or null.`,
    );
  }
}

/** Lower-case enums and upper-case IFSC so storage is consistent. */
function normalise(body: Record<string, unknown>): void {
  const { ifsc, type, status } = body;
  if (typeof ifsc === "string") body.ifsc = ifsc.trim().toUpperCase();
  if (typeof type === "string") body.type = type.trim().toLowerCase();
  if (typeof status === "string") body.status = status.trim().toLowerCase();
}

// ── Params ────────────────────────────────────────────────────────────────────

export const validateAccountIdParam = idParamGuard("Account");

// ── Query ─────────────────────────────────────────────────────────────────────

export const validateAccountListQuery: Guard = (ctx) => {
  const { status, type } = ctx.query as Record<string, string | undefined>;

  assertPageQuery(ctx.query);
  if (status !== undefined) assertStatus(status, "Query param 'status'");
  if (type !== undefined) assertType(type, "Query param 'type'");

  // 'bank' and 'search' are free-text filters — no format constraints.
};

// ── Body ──────────────────────────────────────────────────────────────────────

export const validateCreateAccount: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Record<string, unknown>;

  // Ownership / identity fields must never be supplied by the client.
  rejectFields(
    body,
    ["id", "userId", "accountId"],
    (field) => `Field '${field}' cannot be set by the client.`,
  );

  if (!isNonEmptyString(body.accountName)) {
    throw validationError("Field 'accountName' is required and must be a non-empty string.");
  }

  if (!isNonEmptyString(body.bank)) {
    throw validationError("Field 'bank' is required and must be a non-empty string.");
  }

  assertType(body.type, "Field 'type' is required and");
  if (body.status !== undefined) assertStatus(body.status, "Field 'status'");
  assertIdentifiers(body);
  assertDates(body);
  assertOptional(
    body,
    "currentBalance",
    isNonNegativeNumber,
    "Field 'currentBalance' must be a non-negative number.",
  );

  normalise(body);
};

export const validateUpdateAccount: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Record<string, unknown>;
  const { openingDate, closingDate } = body;

  // Immutable / owner fields cannot be changed through the update API.
  rejectFields(
    body,
    ["id", "userId", "accountId", "currentBalance"],
    (field) => `Field '${field}' cannot be updated through this endpoint.`,
  );
  assertAtLeastOne(body, UPDATABLE_FIELDS);

  for (const field of ["accountName", "bank"]) {
    assertOptional(body, field, isNonEmptyString, `Field '${field}' must be a non-empty string.`);
  }

  assertIdentifiers(body);
  if (body.type !== undefined) assertType(body.type, "Field 'type'");
  if (body.status !== undefined) assertStatus(body.status, "Field 'status'");
  assertDates(body);

  if (
    typeof openingDate === "string" &&
    typeof closingDate === "string" &&
    openingDate > closingDate
  ) {
    throw validationError("Field 'openingDate' must not be after 'closingDate'.");
  }

  normalise(body);
};
