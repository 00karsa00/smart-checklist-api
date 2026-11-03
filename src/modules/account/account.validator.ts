import { AccountStatus, AccountType } from "../../common/enums/account.enum";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import {
  assertPageQuery,
  isDate,
  isNonEmptyString,
  isNonNegativeNumber,
  isOneOf,
  isUuid,
  validationError,
} from "../../common/validation/rules";
import { Guard } from "../../infrastructure/http";

const VALID_ACCOUNT_TYPES = Object.values(AccountType) as string[];
const VALID_ACCOUNT_STATUSES = Object.values(AccountStatus) as string[];

function isNullableNonEmptyString(value: unknown): boolean {
  return value === null || isNonEmptyString(value);
}

function isNullableDate(value: unknown): boolean {
  return value === null || isDate(value);
}

function invalidType(message: string): AppError {
  return new AppError(400, ERROR_CODES.INVALID_ACCOUNT_TYPE, message);
}

function invalidStatus(message: string): AppError {
  return new AppError(400, ERROR_CODES.INVALID_ACCOUNT_STATUS, message);
}

/** Lower-case enums and upper-case IFSC so storage is consistent. */
function normalise(body: Record<string, unknown>): void {
  const { ifsc, type, status } = body;
  if (typeof ifsc === "string") body.ifsc = ifsc.trim().toUpperCase();
  if (typeof type === "string") body.type = type.trim().toLowerCase();
  if (typeof status === "string") body.status = status.trim().toLowerCase();
}

// ── Params ────────────────────────────────────────────────────────────────────

export const validateAccountIdParam: Guard = (ctx) => {
  const { id } = ctx.params;

  if (!id) throw validationError("Account id is required.");
  if (!isUuid(id)) throw validationError("Account id must be a valid UUID.");
};

// ── Query ─────────────────────────────────────────────────────────────────────

export const validateAccountListQuery: Guard = (ctx) => {
  const { status, type } = ctx.query as Record<string, string | undefined>;

  assertPageQuery(ctx.query);

  if (status !== undefined && !VALID_ACCOUNT_STATUSES.includes(status)) {
    throw invalidStatus(
      `Query param 'status' must be one of: ${VALID_ACCOUNT_STATUSES.join(", ")}.`,
    );
  }

  if (type !== undefined && !VALID_ACCOUNT_TYPES.includes(type)) {
    throw invalidType(`Query param 'type' must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}.`);
  }

  // 'bank' and 'search' are free-text filters — no format constraints.
};

// ── Body ──────────────────────────────────────────────────────────────────────

export const validateCreateAccount: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Record<string, unknown>;
  const {
    accountName,
    bank,
    accountNumber,
    customerNumber,
    ifsc,
    type,
    status,
    openingDate,
    closingDate,
    currentBalance,
  } = body;

  // Ownership / identity fields must never be supplied by the client.
  for (const forbidden of ["id", "userId", "accountId"]) {
    if (body[forbidden] !== undefined) {
      throw validationError(`Field '${forbidden}' cannot be set by the client.`);
    }
  }

  if (!isNonEmptyString(accountName)) {
    throw validationError("Field 'accountName' is required and must be a non-empty string.");
  }

  if (!isNonEmptyString(bank)) {
    throw validationError("Field 'bank' is required and must be a non-empty string.");
  }

  if (!isOneOf(type, VALID_ACCOUNT_TYPES)) {
    throw invalidType(
      `Field 'type' is required and must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}.`,
    );
  }

  if (status !== undefined && !isOneOf(status, VALID_ACCOUNT_STATUSES)) {
    throw invalidStatus(`Field 'status' must be one of: ${VALID_ACCOUNT_STATUSES.join(", ")}.`);
  }

  if (accountNumber !== undefined && !isNullableNonEmptyString(accountNumber)) {
    throw validationError("Field 'accountNumber' must be a non-empty string or null.");
  }

  if (customerNumber !== undefined && !isNullableNonEmptyString(customerNumber)) {
    throw validationError("Field 'customerNumber' must be a non-empty string or null.");
  }

  if (ifsc !== undefined && !isNullableNonEmptyString(ifsc)) {
    throw validationError("Field 'ifsc' must be a non-empty string or null.");
  }

  if (openingDate !== undefined && !isNullableDate(openingDate)) {
    throw validationError("Field 'openingDate' must be a valid date in YYYY-MM-DD format or null.");
  }

  if (closingDate !== undefined && !isNullableDate(closingDate)) {
    throw validationError("Field 'closingDate' must be a valid date in YYYY-MM-DD format or null.");
  }

  if (currentBalance !== undefined && !isNonNegativeNumber(currentBalance)) {
    throw validationError("Field 'currentBalance' must be a non-negative number.");
  }

  normalise(body);
};

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

export const validateUpdateAccount: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Record<string, unknown>;
  const {
    accountName,
    bank,
    accountNumber,
    customerNumber,
    ifsc,
    type,
    status,
    openingDate,
    closingDate,
  } = body;

  // Immutable / owner fields cannot be changed through the update API.
  for (const forbidden of ["id", "userId", "accountId", "currentBalance"]) {
    if (body[forbidden] !== undefined) {
      throw validationError(`Field '${forbidden}' cannot be updated through this endpoint.`);
    }
  }

  if (!UPDATABLE_FIELDS.some((field) => body[field] !== undefined)) {
    throw validationError(
      `Request body must include at least one of: ${UPDATABLE_FIELDS.map((f) => `'${f}'`).join(", ")}.`,
    );
  }

  if (accountName !== undefined && !isNonEmptyString(accountName)) {
    throw validationError("Field 'accountName' must be a non-empty string.");
  }

  if (bank !== undefined && !isNonEmptyString(bank)) {
    throw validationError("Field 'bank' must be a non-empty string.");
  }

  if (accountNumber !== undefined && !isNullableNonEmptyString(accountNumber)) {
    throw validationError("Field 'accountNumber' must be a non-empty string or null.");
  }

  if (customerNumber !== undefined && !isNullableNonEmptyString(customerNumber)) {
    throw validationError("Field 'customerNumber' must be a non-empty string or null.");
  }

  if (ifsc !== undefined && !isNullableNonEmptyString(ifsc)) {
    throw validationError("Field 'ifsc' must be a non-empty string or null.");
  }

  if (type !== undefined && !isOneOf(type, VALID_ACCOUNT_TYPES)) {
    throw invalidType(`Field 'type' must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}.`);
  }

  if (status !== undefined && !isOneOf(status, VALID_ACCOUNT_STATUSES)) {
    throw invalidStatus(`Field 'status' must be one of: ${VALID_ACCOUNT_STATUSES.join(", ")}.`);
  }

  if (openingDate !== undefined && !isNullableDate(openingDate)) {
    throw validationError("Field 'openingDate' must be a valid date in YYYY-MM-DD format or null.");
  }

  if (closingDate !== undefined && !isNullableDate(closingDate)) {
    throw validationError("Field 'closingDate' must be a valid date in YYYY-MM-DD format or null.");
  }

  if (
    typeof openingDate === "string" &&
    typeof closingDate === "string" &&
    openingDate > closingDate
  ) {
    throw validationError("Field 'openingDate' must not be after 'closingDate'.");
  }

  normalise(body);
};
