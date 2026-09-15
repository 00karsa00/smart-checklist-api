import { Request, Response, NextFunction } from "express";

import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";

// ── Helpers ───────────────────────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_RE.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validationError(message: string): AppError {
  return new AppError(400, ERROR_CODES.VALIDATION_ERROR, message);
}

// ── Param validators ──────────────────────────────────────────────────────────

/**
 * Validates :id route param for GET /users/:id, PATCH /users/:id,
 * DELETE /users/:id.
 */
export function validateUserIdParam(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const { id } = req.params;

  if (!id) {
    return next(validationError("User id is required."));
  }

  if (!isValidUuid(id)) {
    return next(validationError("User id must be a valid UUID."));
  }

  next();
}

// ── Query validators ──────────────────────────────────────────────────────────

/**
 * Validates query params for GET /users?page=&limit=
 */
export function validateUserListQuery(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const { page, limit } = req.query as { page?: string; limit?: string };

  if (page !== undefined) {
    const p = Number(page);
    if (!Number.isInteger(p) || p < 1) {
      return next(validationError("Query param 'page' must be a positive integer."));
    }
  }

  if (limit !== undefined) {
    const l = Number(limit);
    if (!Number.isInteger(l) || l < 1 || l > 100) {
      return next(validationError("Query param 'limit' must be an integer between 1 and 100."));
    }
  }

  next();
}

// ── Body validators ───────────────────────────────────────────────────────────

/**
 * Validates request body for POST /users
 */
export function validateCreateUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const { name, email } = req.body ?? {};

  if (!isNonEmptyString(name)) {
    return next(validationError("Field 'name' is required and must be a non-empty string."));
  }

  if (name.trim().length > 100) {
    return next(validationError("Field 'name' must not exceed 100 characters."));
  }

  if (!isNonEmptyString(email)) {
    return next(validationError("Field 'email' is required and must be a non-empty string."));
  }

  if (!isValidEmail(email)) {
    return next(validationError("Field 'email' must be a valid email address."));
  }

  next();
}

/**
 * Validates request body for PATCH /users/:id
 */
export function validateUpdateUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const { name, email, isActive } = req.body ?? {};

  // At least one updatable field must be present
  if (name === undefined && email === undefined && isActive === undefined) {
    return next(
      validationError(
        "Request body must include at least one of: 'name', 'email', 'isActive'.",
      ),
    );
  }

  if (name !== undefined) {
    if (!isNonEmptyString(name)) {
      return next(validationError("Field 'name' must be a non-empty string."));
    }
    if (name.trim().length > 100) {
      return next(validationError("Field 'name' must not exceed 100 characters."));
    }
  }

  if (email !== undefined) {
    if (!isNonEmptyString(email)) {
      return next(validationError("Field 'email' must be a non-empty string."));
    }
    if (!isValidEmail(email)) {
      return next(validationError("Field 'email' must be a valid email address."));
    }
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    return next(validationError("Field 'isActive' must be a boolean."));
  }

  next();
}
