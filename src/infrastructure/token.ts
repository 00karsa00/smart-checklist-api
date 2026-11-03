import jwt from "jsonwebtoken";

import { configuration } from "../config/configuration";

export interface TokenClaims {
  /** User id. */
  sub: string;
  /** Issued at, seconds since epoch. */
  iat?: number;
  /** Expires at, seconds since epoch. */
  exp?: number;
}

export type TokenCheck =
  | { ok: true; claims: TokenClaims }
  | { ok: false; reason: "expired" | "invalid" };

export function signToken(userId: string): string {
  const claims: TokenClaims = { sub: userId };
  return jwt.sign(claims, configuration.jwt.secret, {
    expiresIn: configuration.jwt.expiresIn as jwt.SignOptions["expiresIn"],
  });
}

/** Verify a token. Never throws; callers decide which error to raise. */
export function verifyToken(token: string): TokenCheck {
  try {
    const claims = jwt.verify(token, configuration.jwt.secret) as TokenClaims;
    return { ok: true, claims };
  } catch (error) {
    return { ok: false, reason: error instanceof jwt.TokenExpiredError ? "expired" : "invalid" };
  }
}
