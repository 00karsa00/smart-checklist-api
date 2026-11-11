import { AnyHttpContext, Guard } from "../../infrastructure/http";
import { TokenClaims, verifyToken } from "../../infrastructure/token";
import { AppError } from "../errors/app.error";
import { ERROR_CODES } from "../errors/error.codes";
import { ACCOUNT_KINDS, AccountKind } from "../types/authenticated-user.type";

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
  // Tokens issued before account kinds existed are refused.
  if (!(ACCOUNT_KINDS as readonly string[]).includes(check.claims.kind)) {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, "Invalid token.");
  }

  return check.claims;
}

/** Require a valid `Authorization: Bearer <token>` and set ctx.user. */
export const authenticate: Guard = (ctx) => {
  const header = ctx.header("authorization");

  if (!header || !header.startsWith(BEARER)) throw missingToken();

  const claims = requireValidToken(header.slice(BEARER.length));
  ctx.user = { userId: claims.sub, kind: claims.kind as AccountKind, sessionId: claims.sid };
};

/** Like `authenticate`, but only for tokens of one account kind (403 for others). */
export function authenticateAs(kind: AccountKind): Guard {
  return (ctx) => {
    authenticate(ctx);
    if (ctx.user?.kind !== kind) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, "Your account cannot use this endpoint.");
    }
  };
}

/** The signed-in user's id. Use on routes behind `authenticate`. */
export function currentUserId(ctx: AnyHttpContext): string {
  if (!ctx.user) throw missingToken();
  return ctx.user.userId;
}

/** The signed-in session's id, when the token names one. Use on routes behind `authenticate`. */
export function currentSessionId(ctx: AnyHttpContext): string | undefined {
  return ctx.user?.sessionId;
}
