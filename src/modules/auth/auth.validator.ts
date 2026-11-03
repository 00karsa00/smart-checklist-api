import { isNonEmptyString, isUuidV4, validationError } from "../../common/validation/rules";
import { Guard } from "../../infrastructure/http";

export const validateGenerateTokenBody: Guard = (ctx) => {
  const { userId } = (ctx.body ?? {}) as { userId?: unknown };

  if (!isNonEmptyString(userId)) {
    throw validationError("userId is required and must be a non-empty string");
  }

  if (!isUuidV4(userId.trim())) {
    throw validationError("userId must be a valid UUID v4");
  }
};

export const validateValidateTokenBody: Guard = (ctx) => {
  const { token } = (ctx.body ?? {}) as { token?: unknown };

  if (!isNonEmptyString(token)) {
    throw validationError("token is required and must be a non-empty string");
  }
};
