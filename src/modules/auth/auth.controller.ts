import { Request, Response, NextFunction } from "express";

import { ApiSuccessResponse } from "../../common/responses/api-response";

import { GenerateTokenDto, ValidateTokenDto } from "./dto/auth.dto";
import { GenerateTokenResponse, ValidateTokenResponse } from "./types/auth.type";
import { authService } from "./auth.service";

// ── Helpers ───────────────────────────────────────────────────────────────────

function withRequestId<T>(
  response: ApiSuccessResponse<T>,
  req: Request,
): ApiSuccessResponse<T> {
  return { ...response, requestId: req.headers["x-request-id"] };
}

// ── Controllers ───────────────────────────────────────────────────────────────

export async function generateToken(
  req: Request<Record<string, never>, ApiSuccessResponse<GenerateTokenResponse>, GenerateTokenDto>,
  res: Response<ApiSuccessResponse<GenerateTokenResponse>>,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.generateToken(req.body);
    res.status(201).json(withRequestId(result, req));
  } catch (error) {
    next(error);
  }
}

export async function validateToken(
  req: Request<Record<string, never>, ApiSuccessResponse<ValidateTokenResponse>, ValidateTokenDto>,
  res: Response<ApiSuccessResponse<ValidateTokenResponse>>,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.validateToken(req.body);
    res.status(200).json(withRequestId(result, req));
  } catch (error) {
    next(error);
  }
}
