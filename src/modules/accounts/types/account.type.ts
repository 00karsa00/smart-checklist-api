import { AccountKind, AppError } from "../../../common";

import type { AccountSecrets } from "../account-secrets";

/** Login methods the API can verify. Add one here and in auth's LOGIN_VERIFIERS. */
export const LOGIN_METHODS = ["password"] as const;
export type LoginMethod = (typeof LOGIN_METHODS)[number];

/** What sign-in needs from any account, admin or user. */
export type LoginAccount = {
  id: string;
  /** How this account signs in, e.g. "password". */
  loginMethod: string;
  isActive: boolean;
};

/** Where a request came from, for the login log and session list. */
export type ClientInfo = {
  ipAddress: string | null;
  userAgent: string | null;
};

/** A session row as the repository returns it. */
export type StoredSession = {
  id: string;
  accountId: string;
  /** Hash of the refresh token the session holds now. */
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  /** When the token was last refreshed (null until the first refresh). */
  rotatedAt: Date | null;
};

/** A signed-in device, as listed to its owner. */
export type SessionInfo = {
  id: string;
  /** When this device signed in. */
  signedInAt: Date;
  /** Last sign-in or token refresh. */
  lastActiveAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  /** True for the session making the request. */
  current: boolean;
};

/** A session just started: what the client must keep to renew its access token. */
export type IssuedSession = {
  sessionId: string;
  refreshToken: string;
  refreshExpiresAt: Date;
};

/** One sign-in attempt, as written by the auth module. */
export type LoginLogEntry = {
  /** The matching account, or null when the identifier matched none. */
  accountId: string | null;
  /** What was typed to sign in: a user name, email or phone. */
  identifier: string;
  loginMethod: string | null;
  isSuccess: boolean;
  /** Error code of a failed attempt, e.g. INVALID_CREDENTIALS. */
  failureReason: string | null;
} & ClientInfo;

/** A login log row returned to API clients. */
export type LoginLog = { id: string; createdAt: Date } & LoginLogEntry;

/**
 * One kind of account, as the auth module sees it. Each account module
 * (admin, user) provides one, so sign-in and sessions work the same for all.
 */
export type AccountDirectory<A extends LoginAccount = LoginAccount, Session = unknown> = {
  readonly kind: AccountKind;
  /** Its password table and login log. */
  readonly secrets: AccountSecrets;
  /** Any account (active or not) for a normalised sign-in identifier. */
  findByIdentifier(identifier: string): Promise<A | null>;
  findById(id: string): Promise<A | null>;
  /** The error for an identifier that matches no account. */
  notFoundError(): AppError;
  /** The public profile returned on sign-in and from /me. */
  toSession(account: A): Session;
};
