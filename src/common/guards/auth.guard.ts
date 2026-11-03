import { AnyHttpContext, Guard } from "../../infrastructure/http";
import { verifyToken } from "../../infrastructure/token";
import { AppError } from "../errors/app.error";
import { ERROR_CODES } from "../errors/error.codes";

const BEARER = "Bearer ";

/** Require a valid `Authorization: Bearer <token>` and set ctx.user. */
export const authenticate: Guard = (ctx) => {
  const header = ctx.header("authorization");

  if (!header || !header.startsWith(BEARER)) {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, "Authorization token is required.");
  }

  const check = verifyToken(header.slice(BEARER.length));

  if (!check.ok) {
    throw check.reason === "expired"
      ? new AppError(401, ERROR_CODES.TOKEN_EXPIRED, "Token has expired.")
      : new AppError(401, ERROR_CODES.UNAUTHORIZED, "Invalid token.");
  }

  ctx.user = { userId: check.claims.sub };
};

/** The signed-in user's id. Use on routes behind `authenticate`. */
export function currentUserId(ctx: AnyHttpContext): string {
  if (!ctx.user) {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, "Authorization token is required.");
  }
  return ctx.user.userId;
}
