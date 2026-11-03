import { AnyHttpContext, Guard } from "../../infrastructure/http";
import { TokenClaims, verifyToken } from "../../infrastructure/token";
import { AppError } from "../errors/app.error";
import { ERROR_CODES } from "../errors/error.codes";

const BEARER = "Bearer ";

function missingToken(): AppError {
  return new AppError(401, ERROR_CODES.UNAUTHORIZED, "Authorization token is required.");
}

/** The token's claims, or the matching 401 error when it is expired or invalid. */
export function requireValidToken(token: string): TokenClaims {
  const check = verifyToken(token);

  if (!check.ok) {
    throw check.reason === "expired"
      ? new AppError(401, ERROR_CODES.TOKEN_EXPIRED, "Token has expired.")
      : new AppError(401, ERROR_CODES.UNAUTHORIZED, "Invalid token.");
  }

  return check.claims;
}

/** Require a valid `Authorization: Bearer <token>` and set ctx.user. */
export const authenticate: Guard = (ctx) => {
  const header = ctx.header("authorization");

  if (!header || !header.startsWith(BEARER)) throw missingToken();

  ctx.user = { userId: requireValidToken(header.slice(BEARER.length)).sub };
};

/** The signed-in user's id. Use on routes behind `authenticate`. */
export function currentUserId(ctx: AnyHttpContext): string {
  if (!ctx.user) throw missingToken();
  return ctx.user.userId;
}
