import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { configuration } from "../../config/configuration";
import { AppError } from "../errors/app.error";
import { ERROR_CODES } from "../errors/error.codes";
import { TokenPayload } from "../../modules/auth/types/auth.type";

import "../../common/types/request-context.type";

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new AppError(401, ERROR_CODES.UNAUTHORIZED, "Authorization token is required."),
    );
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const decoded = jwt.verify(token, configuration.jwt.secret) as TokenPayload;
    req.user = { userId: decoded.sub };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, ERROR_CODES.TOKEN_EXPIRED, "Token has expired."));
    }
    return next(new AppError(401, ERROR_CODES.UNAUTHORIZED, "Invalid token."));
  }
}
