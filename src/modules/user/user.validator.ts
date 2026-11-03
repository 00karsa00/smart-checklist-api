import {
  assertAtLeastOne,
  assertPageQuery,
  idParamGuard,
  isEmail,
  isNonEmptyString,
  validationError,
} from "../../common/validation/rules";
import { Guard } from "../../infrastructure/http";

const MAX_NAME_LENGTH = 100;

// ── Params ────────────────────────────────────────────────────────────────────

export const validateUserIdParam = idParamGuard("User");

// ── Query ─────────────────────────────────────────────────────────────────────

export const validateUserListQuery: Guard = (ctx) => {
  assertPageQuery(ctx.query);
};

// ── Body ──────────────────────────────────────────────────────────────────────

export const validateCreateUser: Guard = (ctx) => {
  const { name, email } = ctx.body ?? {};

  if (!isNonEmptyString(name)) {
    throw validationError("Field 'name' is required and must be a non-empty string.");
  }

  if (name.trim().length > MAX_NAME_LENGTH) {
    throw validationError(`Field 'name' must not exceed ${MAX_NAME_LENGTH} characters.`);
  }

  if (!isNonEmptyString(email)) {
    throw validationError("Field 'email' is required and must be a non-empty string.");
  }

  if (!isEmail(email)) {
    throw validationError("Field 'email' must be a valid email address.");
  }
};

export const validateUpdateUser: Guard = (ctx) => {
  const { name, email, isActive } = ctx.body ?? {};

  assertAtLeastOne(ctx.body ?? {}, ["name", "email", "isActive"]);

  if (name !== undefined) {
    if (!isNonEmptyString(name)) {
      throw validationError("Field 'name' must be a non-empty string.");
    }
    if (name.trim().length > MAX_NAME_LENGTH) {
      throw validationError(`Field 'name' must not exceed ${MAX_NAME_LENGTH} characters.`);
    }
  }

  if (email !== undefined) {
    if (!isNonEmptyString(email)) {
      throw validationError("Field 'email' must be a non-empty string.");
    }
    if (!isEmail(email)) {
      throw validationError("Field 'email' must be a valid email address.");
    }
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    throw validationError("Field 'isActive' must be a boolean.");
  }
};
