import { isNonEmptyString, validationError } from "../../common";
import { Guard } from "../../infrastructure/http";

import { normaliseUserName } from "../admin/admin.validator";
import { normaliseSignInIdentifier } from "../user/user.validator";

const MAX_IDENTIFIER_LENGTH = 255;

type Body = Record<string, unknown>;

// Method-specific fields (such as `password`) are checked by that method's verifier.

/** Require `userName` and normalise it in place (trimmed, lower-case). */
export const validateAdminSignIn: Guard = (ctx) => {
  const body = { ...((ctx.body ?? {}) as Body) };
  normaliseUserName(body);
  ctx.body = body;
};

/** Require `identifier` (email or phone) and normalise it in place. */
export const validateUserSignIn: Guard = (ctx) => {
  const body = { ...((ctx.body ?? {}) as Body) };
  if (!isNonEmptyString(body.identifier) || body.identifier.length > MAX_IDENTIFIER_LENGTH) {
    throw validationError("Field 'identifier' must be your email or phone number.");
  }
  body.identifier = normaliseSignInIdentifier(body.identifier);
  ctx.body = body;
};

export const validateValidateTokenBody: Guard = (ctx) => {
  const { token } = (ctx.body ?? {}) as { token?: unknown };

  if (!isNonEmptyString(token)) {
    throw validationError("token is required and must be a non-empty string");
  }
};

/** `{ refreshToken }` for refresh and logout. */
export const validateRefreshTokenBody: Guard = (ctx) => {
  const { refreshToken } = (ctx.body ?? {}) as { refreshToken?: unknown };

  if (!isNonEmptyString(refreshToken)) {
    throw validationError("Field 'refreshToken' is required.");
  }
};
