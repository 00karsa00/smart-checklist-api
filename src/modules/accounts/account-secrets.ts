import {
  AppError,
  validationError,
  buildPaginatedData,
  ERROR_CODES,
  pageOffset,
  PageRequest,
  PaginatedData,
} from "../../common";
import { configuration } from "../../config/configuration";
import { hashPassword, verifyPassword } from "../../infrastructure/password";
import { createRefreshToken, hashRefreshToken } from "../../infrastructure/token";

import { LoginLogFilter } from "./dto/account.dto";
import { LoginLogRepository } from "./login-log.repository";
import { PasswordRepository } from "./password.repository";
import { SessionRepository } from "./session.repository";
import {
  ClientInfo,
  IssuedSession,
  LoginLog,
  LoginLogEntry,
  SessionInfo,
} from "./types/account.type";

const DAY_MS = 24 * 60 * 60 * 1000;
/**
 * A refresh token used again within this time after it was replaced gets a
 * fresh pair for the same session: another tab refreshed first, or a page was
 * left before it could keep the reply (refusing it then signed the user out).
 * Later reuse looks like a stolen token, so every session of the account is
 * ended. The time counts from the replacement and is not extended by these
 * repeats. Only the token replaced last is remembered; older ones are unknown.
 */
const REUSE_GRACE_MS = 60 * 1000;

function invalidRefreshToken(): AppError {
  return new AppError(
    401,
    ERROR_CODES.REFRESH_TOKEN_INVALID,
    "Your session has ended. Please sign in again.",
  );
}

/**
 * Secrets, sessions and login log for one kind of account. Account services hold one
 * and pass its methods on, so admins and users share the same rules.
 */
export class AccountSecrets {
  constructor(
    readonly passwords: PasswordRepository,
    private readonly loginLogs: LoginLogRepository,
    private readonly sessions: SessionRepository,
  ) {}

  /** The hash to store for a new account, when its method uses a password. */
  async hashForNewAccount(loginMethod: string, password?: string): Promise<string | undefined> {
    return loginMethod === "password" && password ? hashPassword(password) : undefined;
  }

  /** True when `password` matches the account's stored password (false when none is set). */
  async passwordMatches(accountId: string, password: string): Promise<boolean> {
    const hash = await this.passwords.findHash(accountId);
    return hash !== null && verifyPassword(password, hash);
  }

  /**
   * The account holder replaces their own password; the current one must match.
   * Their other sessions end; `keepSessionId` (the one making the change) stays.
   */
  async changePassword(
    accountId: string,
    currentPassword: string,
    newPassword: string,
    keepSessionId?: string,
  ): Promise<void> {
    if (!(await this.passwordMatches(accountId, currentPassword))) {
      // 400, not 401: a wrong current password must not end the session.
      throw new AppError(
        400,
        ERROR_CODES.CURRENT_PASSWORD_INCORRECT,
        "Your current password is incorrect.",
      );
    }
    if (newPassword === currentPassword) {
      throw validationError("The new password must be different from the current one.");
    }
    await this.passwords.saveHash(accountId, await hashPassword(newPassword));
    await this.endAllSessions(accountId, keepSessionId);
  }

  /**
   * Set a new password (an admin's reset) and end every session of the account.
   * Works for any login method, so it can be prepared before a switch.
   */
  async resetPassword(accountId: string, password: string): Promise<void> {
    await this.passwords.saveHash(accountId, await hashPassword(password));
    await this.endAllSessions(accountId);
  }

  // ── Sessions (refresh tokens) ─────────────────────────────────────────────

  /** Start a session after sign-in. */
  async startSession(accountId: string, client: ClientInfo): Promise<IssuedSession> {
    const { token, hash } = createRefreshToken();
    const refreshExpiresAt = this.refreshExpiry();
    const sessionId = await this.sessions.create(accountId, hash, refreshExpiresAt, client);
    return { sessionId, refreshToken: token, refreshExpiresAt };
  }

  /**
   * Swap a refresh token for a new one in the same session (rotation): the old
   * token stops working and the expiry starts again. Throws 401
   * REFRESH_TOKEN_INVALID for unknown, expired, ended or already used tokens.
   */
  async rotateSession(
    refreshToken: string,
    client: ClientInfo,
    raced = false,
  ): Promise<IssuedSession & { accountId: string }> {
    const hash = hashRefreshToken(refreshToken);
    const session = await this.sessions.findByHash(hash);

    if (!session) return this.reuse(hash, client);
    if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      throw invalidRefreshToken();
    }

    const next = createRefreshToken();
    const refreshExpiresAt = this.refreshExpiry();
    if (!(await this.sessions.rotate(session.id, hash, next.hash, refreshExpiresAt, client))) {
      // A concurrent refresh with the same token won the race: now it is the
      // replaced token, so it is handled as a quick reuse (once).
      if (raced) throw invalidRefreshToken();
      return this.rotateSession(refreshToken, client, true);
    }
    return {
      accountId: session.accountId,
      sessionId: session.id,
      refreshToken: next.token,
      refreshExpiresAt,
    };
  }

  /** Logout: end the session of this refresh token. Unknown or ended tokens are ignored. */
  async endSession(refreshToken: string): Promise<void> {
    const session = await this.sessions.findByHash(hashRefreshToken(refreshToken));
    if (session && !session.revokedAt) await this.sessions.revoke(session.id);
  }

  /** The account's signed-in devices; `currentSessionId` is marked as this one. */
  async listSessions(accountId: string, currentSessionId?: string): Promise<SessionInfo[]> {
    const sessions = await this.sessions.listActive(accountId);
    return sessions.map((session) => ({ ...session, current: session.id === currentSessionId }));
  }

  /** Sign one of the account's own devices out. 404 when it is not a live session of theirs. */
  async endSessionById(accountId: string, sessionId: string): Promise<void> {
    if (!(await this.sessions.revoke(sessionId, accountId))) {
      throw new AppError(404, ERROR_CODES.SESSION_NOT_FOUND, "This session has already ended.");
    }
  }

  /** End every session of the account (e.g. on deactivation), optionally keeping one. */
  endAllSessions(accountId: string, keepSessionId?: string): Promise<void> {
    return this.sessions.revokeAll(accountId, keepSessionId);
  }

  /** Switching to password sign-in needs a password already set. */
  async assertCanSwitchMethod(
    accountId: string,
    currentMethod: string,
    nextMethod: string | undefined,
  ): Promise<void> {
    if (nextMethod !== "password" || currentMethod === "password") return;
    if (await this.passwords.findHash(accountId)) return;

    throw new AppError(
      400,
      ERROR_CODES.PASSWORD_NOT_SET,
      "Reset this account's password before switching to password sign-in.",
    );
  }

  recordLogin(entry: LoginLogEntry): Promise<void> {
    return this.loginLogs.create(entry);
  }

  async listLoginLogs(page: PageRequest, filter: LoginLogFilter): Promise<PaginatedData<LoginLog>> {
    const { rows, count } = await this.loginLogs.findAll(pageOffset(page), page.limit, filter);
    return buildPaginatedData(rows, { ...page, total: count });
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private refreshExpiry(): Date {
    return new Date(Date.now() + configuration.jwt.refreshTokenDays * DAY_MS);
  }

  /**
   * A token a session replaced is back: right after, a fresh pair for that
   * session (another tab, or a reply lost on the way); later, a likely theft,
   * so every session of the account ends. Unknown tokens are just refused.
   */
  private async reuse(
    hash: string,
    client: ClientInfo,
  ): Promise<IssuedSession & { accountId: string }> {
    const session = await this.sessions.findByPreviousHash(hash);
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      throw invalidRefreshToken();
    }
    const sinceRotation = Date.now() - (session.rotatedAt?.getTime() ?? 0);
    if (sinceRotation > REUSE_GRACE_MS) {
      await this.endAllSessions(session.accountId);
      throw invalidRefreshToken();
    }
    const next = createRefreshToken();
    const refreshExpiresAt = this.refreshExpiry();
    if (
      !(await this.sessions.reissue(
        session.id,
        session.tokenHash,
        next.hash,
        refreshExpiresAt,
        client,
      ))
    ) {
      throw invalidRefreshToken();
    }
    return {
      accountId: session.accountId,
      sessionId: session.id,
      refreshToken: next.token,
      refreshExpiresAt,
    };
  }
}
