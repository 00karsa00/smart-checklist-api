import {
  assertAtLeastOne,
  assertOptional,
  assertPageQuery,
  isBoolean,
  isDate,
  isNonEmptyString,
  isOneOf,
  isUuid,
  rejectFields,
  validationError,
} from "../../common";
import { AnyHttpContext, Guard } from "../../infrastructure/http";

import { LOGIN_METHODS } from "./types/account.type";

// Checks shared by every kind of account.

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const LOG_STATUSES = ["success", "failed"] as const;
const LOGIN_METHOD_MESSAGE = `Field 'loginMethod' must be one of: ${LOGIN_METHODS.join(", ")}.`;

type Body = Record<string, unknown>;

/** The body of an account create, refusing a client-set id. Normalise fields in place. */
export function accountCreateBody(ctx: AnyHttpContext): Body {
  const body = (ctx.body ?? {}) as Body;
  rejectFields(body, ["id"], (field) => `Field '${field}' cannot be set by the client.`);
  ctx.body = body;
  return body;
}

/**
 * The body of an account update: no id or password (that has its own endpoint)
 * and at least one of `fields`. Normalise fields in place.
 */
export function accountUpdateBody(ctx: AnyHttpContext, fields: readonly string[]): Body {
  const body = (ctx.body ?? {}) as Body;
  rejectFields(
    body,
    ["id", "password"],
    (field) => `Field '${field}' cannot be updated through this endpoint.`,
  );
  assertAtLeastOne(body, fields);
  ctx.body = body;
  return body;
}

export function assertPassword(value: unknown, field = "password"): void {
  if (
    typeof value !== "string" ||
    value.length < MIN_PASSWORD_LENGTH ||
    value.length > MAX_PASSWORD_LENGTH
  ) {
    throw validationError(
      `Field '${field}' must be ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters.`,
    );
  }
}

/** `loginMethod`, `password` (for "password") and `isActive` of a new account. */
export function assertNewAccountLogin(body: Body): void {
  if (!isOneOf(body.loginMethod, LOGIN_METHODS)) throw validationError(LOGIN_METHOD_MESSAGE);
  if (body.loginMethod === "password") assertPassword(body.password);
  assertOptionalFlags(body, ["isActive"]);
}

/** Optional `loginMethod` and `isActive` of an account update. */
export function assertAccountLoginChanges(body: Body): void {
  assertOptional(
    body,
    "loginMethod",
    (value) => isOneOf(value, LOGIN_METHODS),
    LOGIN_METHOD_MESSAGE,
  );
  assertOptionalFlags(body, ["isActive"]);
}

/** Each of `fields` that is present must be true or false. */
export function assertOptionalFlags(body: Body, fields: readonly string[]): void {
  for (const field of fields) {
    assertOptional(body, field, isBoolean, `Field '${field}' must be true or false.`);
  }
}

export const validateListQuery: Guard = (ctx) => {
  assertPageQuery(ctx.query);
};

export const validateResetPassword: Guard = (ctx) => {
  assertPassword(((ctx.body ?? {}) as Body).password);
};

/** `{ currentPassword, newPassword }` for an account holder changing their own password. */
export const validateChangePassword: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  if (!isNonEmptyString(body.currentPassword)) {
    throw validationError("Field 'currentPassword' is required.");
  }
  assertPassword(body.newPassword, "newPassword");
};

export const validateLoginLogQuery: Guard = (ctx) => {
  const query = ctx.query as Body & { page?: string; limit?: string };

  assertPageQuery(query);
  assertOptional(query, "accountId", isUuid, "Query param 'accountId' must be a valid UUID.");
  assertOptional(
    query,
    "status",
    (value) => isOneOf(value, LOG_STATUSES),
    "Query param 'status' must be 'success' or 'failed'.",
  );
  assertOptional(query, "from", isDate, "Query param 'from' must be a date (YYYY-MM-DD).");
  assertOptional(query, "to", isDate, "Query param 'to' must be a date (YYYY-MM-DD).");
};
