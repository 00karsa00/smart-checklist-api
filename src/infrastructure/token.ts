import { createHash, randomBytes } from "node:crypto";

import jwt from "jsonwebtoken";

import { configuration } from "../config/configuration";

export type TokenClaims = {
  /** Account id. */
  sub: string;
  /** Which kind of account `sub` belongs to, e.g. "admin" or "user". */
  kind: string;
  /** The session (refresh token row) this access token belongs to. */
  sid?: string;
  /** Issued at, seconds since epoch. */
  iat?: number;
  /** Expires at, seconds since epoch. */
  exp?: number;
};

export type TokenCheck =
  { ok: true; claims: TokenClaims } | { ok: false; reason: "expired" | "invalid" };

export function signToken(subject: string, kind: string, sessionId?: string): string {
  const claims: TokenClaims = { sub: subject, kind, ...(sessionId ? { sid: sessionId } : {}) };
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

// Refresh tokens are random, not JWTs: they are looked up in the database,
// which stores only their SHA-256 hash.

/** A new random refresh token and the hash to store for it. */
export function createRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
