import {
  assertOptional,
  idParamGuard,
  isNonEmptyString,
  isOneOf,
  validationError,
} from "../../common";
import { Guard } from "../../infrastructure/http";

import {
  accountCreateBody,
  accountUpdateBody,
  assertAccountLoginChanges,
  assertNewAccountLogin,
} from "../accounts";
import { ADMIN_ROLES } from "./admin-roles";

const MAX_USER_NAME_LENGTH = 100;
const USER_NAME_RE = /^[a-z0-9._@-]+$/;

type Body = Record<string, unknown>;

/** Require `body.userName` and normalise it in place (trimmed, lower-case). */
export function normaliseUserName(body: Body): void {
  if (!isNonEmptyString(body.userName)) {
    throw validationError("Field 'userName' is required and must be a non-empty string.");
  }

  const userName = body.userName.trim().toLowerCase();
  if (userName.length > MAX_USER_NAME_LENGTH) {
    throw validationError(`Field 'userName' must not exceed ${MAX_USER_NAME_LENGTH} characters.`);
  }
  body.userName = userName;
}

/** Stricter rules for names being created or changed (sign-in only needs normalising). */
function assertNewUserName(body: Body): void {
  normaliseUserName(body);
  if (!USER_NAME_RE.test(body.userName as string)) {
    throw validationError(
      "Field 'userName' may only contain letters, numbers, and . _ @ - (no spaces).",
    );
  }
}

function assertOptionalRole(body: Body): void {
  assertOptional(
    body,
    "role",
    (value) => isOneOf(value, ADMIN_ROLES),
    `Field 'role' must be one of: ${ADMIN_ROLES.join(", ")}.`,
  );
}

export const validateAdminIdParam = idParamGuard("Admin user");

export const validateCreateAdmin: Guard = (ctx) => {
  const body = accountCreateBody(ctx);
  assertNewUserName(body);
  assertNewAccountLogin(body);
  assertOptionalRole(body);
};

export const validateUpdateAdmin: Guard = (ctx) => {
  const body = accountUpdateBody(ctx, ["userName", "loginMethod", "role", "isActive"]);
  if (body.userName !== undefined) assertNewUserName(body);
  assertAccountLoginChanges(body);
  assertOptionalRole(body);
};
