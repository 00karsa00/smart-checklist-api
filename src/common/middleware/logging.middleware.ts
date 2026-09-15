import { Request, Response, NextFunction } from "express";
import { logger } from "../../infrastructure/observability/logger/logger";

export function loggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;

    logger.info("HTTP Request", {
      requestId: req.headers["x-request-id"],
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
    });
  });

  next();
}

