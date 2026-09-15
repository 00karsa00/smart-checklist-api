import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app.error";
import { logger } from "../../infrastructure/observability/logger/logger";

export function errorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const requestId = req.headers["x-request-id"];

  if (error instanceof AppError) {
    logger.error(error.message, {
      requestId,
      code: error.code,
      statusCode: error.statusCode,
    });

    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
      requestId,
    });
  }

  logger.error("Unhandled application error", {
    requestId,
    error,
  });

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    },
    requestId,
  });
}