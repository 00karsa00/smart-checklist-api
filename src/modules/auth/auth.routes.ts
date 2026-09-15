import { Router, Request, Response, NextFunction } from "express";

import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";

import { generateToken, validateToken } from "./auth.controller";

const router = Router();

// ── Validators ────────────────────────────────────────────────────────────────

function validateGenerateTokenBody(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const { userId } = req.body as { userId?: unknown };

  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return next(
      new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        "userId is required and must be a non-empty string",
      ),
    );
  }

  // Basic UUID v4 format check
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId.trim())) {
    return next(
      new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        "userId must be a valid UUID v4",
      ),
    );
  }

  next();
}

function validateValidateTokenBody(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const { token } = req.body as { token?: unknown };

  if (!token || typeof token !== "string" || token.trim() === "") {
    return next(
      new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        "token is required and must be a non-empty string",
      ),
    );
  }

  next();
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/auth/token  — generate a JWT for a given userId
router.post("/token", validateGenerateTokenBody, generateToken);

// POST /api/auth/token/validate  — validate an existing JWT
router.post("/token/validate", validateValidateTokenBody, validateToken);

export default router;
