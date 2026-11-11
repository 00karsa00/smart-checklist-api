import {
  assertRequiredText,
  idParamGuard,
  isEmail,
  rejectFields,
  rejectUnknownFields,
  validationError,
} from "../../common";
import { Guard } from "../../infrastructure/http";

import {
  accountCreateBody,
  accountUpdateBody,
  assertAccountLoginChanges,
  assertNewAccountLogin,
  assertOptionalFlags,
} from "../accounts";

const MAX_NAME_LENGTH = 150;
const MAX_EMAIL_LENGTH = 255;
const PHONE_RE = /^\+?[0-9]{7,15}$/;
const PHONE_SEPARATORS_RE = /[\s().-]/g;
const FLAGS = ["isActive", "isEmailVerified", "isPhoneVerified"] as const;
const PROFILE_FIELDS = ["name", "email", "phone"] as const;

type Body = Record<string, unknown>;

export const normaliseEmail = (value: string) => value.trim().toLowerCase();
export const normalisePhone = (value: string) => value.replace(PHONE_SEPARATORS_RE, "");

/** Email or phone typed to sign in, in the form it is stored. */
export function normaliseSignInIdentifier(value: string): string {
  return value.includes("@") ? normaliseEmail(value) : normalisePhone(value.trim());
}

function assertName(body: Body): void {
  assertRequiredText(body, "name", MAX_NAME_LENGTH);
}

/** Normalise `email` and `phone` in place. Absent stays absent; null or "" means none. */
function assertContact(body: Body): void {
  if (body.email === "") body.email = null;
  if (body.phone === "") body.phone = null;

  if (body.email !== undefined && body.email !== null) {
    const email = typeof body.email === "string" ? normaliseEmail(body.email) : "";
    if (!isEmail(email) || email.length > MAX_EMAIL_LENGTH) {
      throw validationError(
        `Field 'email' must be a valid email of at most ${MAX_EMAIL_LENGTH} characters.`,
      );
    }
    body.email = email;
  }

  if (body.phone !== undefined && body.phone !== null) {
    const phone = typeof body.phone === "string" ? normalisePhone(body.phone) : "";
    if (!PHONE_RE.test(phone)) {
      throw validationError("Field 'phone' must be 7 to 15 digits, optionally starting with +.");
    }
    body.phone = phone;
  }
}

export const validateUserIdParam = idParamGuard("User");

export const validateCreateUser: Guard = (ctx) => {
  const body = accountCreateBody(ctx);
  assertName(body);
  assertContact(body);
  if (!body.email && !body.phone) {
    throw validationError("A user needs an email or a phone number.");
  }
  assertNewAccountLogin(body);
  assertOptionalFlags(body, FLAGS);
};

/**
 * Self-registration: name, email and/or phone, and a password. Everything
 * else is fixed by the server (password sign-in, active, unverified).
 */
export const validateRegisterUser: Guard = (ctx) => {
  const body = accountCreateBody(ctx);
  rejectFields(
    body,
    ["loginMethod", ...FLAGS],
    (field) => `Field '${field}' cannot be set when registering.`,
  );
  body.loginMethod = "password";
  return validateCreateUser(ctx);
};

/** A user editing their own profile: name, email and phone only. */
export const validateUpdateOwnProfile: Guard = (ctx) => {
  rejectUnknownFields(
    (ctx.body ?? {}) as Body,
    PROFILE_FIELDS,
    (field) => `Field '${field}' cannot be changed from your profile.`,
  );
  const body = accountUpdateBody(ctx, PROFILE_FIELDS);
  if (body.name !== undefined) assertName(body);
  assertContact(body);
};

export const validateUpdateUser: Guard = (ctx) => {
  const body = accountUpdateBody(ctx, ["name", "email", "phone", "loginMethod", ...FLAGS]);
  if (body.name !== undefined) assertName(body);
  assertContact(body);
  assertAccountLoginChanges(body);
  assertOptionalFlags(body, FLAGS);
};
