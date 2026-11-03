export const ERROR_CODES = {
  // General
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",

  // Authentication
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",

  // Database
  DATABASE_ERROR: "DATABASE_ERROR",

  // One section per module.
  // Example module
  ITEM_NOT_FOUND: "ITEM_NOT_FOUND",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
