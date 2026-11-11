import {
  between,
  notEqual,
  SessionAttributes,
  SessionTable,
  Where,
} from "../../infrastructure/database";

import { ClientInfo, SessionInfo, StoredSession } from "./types/account.type";

// Database column limit; a longer user agent is cut rather than rejected.
const MAX_USER_AGENT = 500;

function clientColumns(client: ClientInfo) {
  return {
    ipAddress: client.ipAddress,
    userAgent: client.userAgent?.slice(0, MAX_USER_AGENT) ?? null,
  };
}

type SessionRowFields = Pick<
  SessionAttributes,
  "id" | "createdAt" | "rotatedAt" | "expiresAt" | "ipAddress" | "userAgent"
>;

/** A session row as its owner sees it in the device list. */
export function toSessionInfo(row: SessionRowFields): Omit<SessionInfo, "current"> {
  return {
    id: row.id,
    signedInAt: row.createdAt,
    lastActiveAt: row.rotatedAt ?? row.createdAt,
    expiresAt: row.expiresAt,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
  };
}

/** One account kind's sessions (admin_session, app_user_session, …). */
export class SessionRepository {
  constructor(private readonly table: SessionTable) {}

  /** Store a new session; returns its id. */
  async create(
    accountId: string,
    tokenHash: string,
    expiresAt: Date,
    client: ClientInfo,
  ): Promise<string> {
    const row = await this.table.create({
      accountId,
      tokenHash,
      expiresAt,
      ...clientColumns(client),
    });
    return row.id;
  }

  async findByHash(tokenHash: string): Promise<StoredSession | null> {
    return this.findOne({ tokenHash });
  }

  /** The session whose last refresh replaced this token. */
  async findByPreviousHash(tokenHash: string): Promise<StoredSession | null> {
    return this.findOne({ previousTokenHash: tokenHash });
  }

  /**
   * Swap the session's token, only if it still holds `currentHash` and is live.
   * False when another refresh with the same token got there first.
   */
  async rotate(
    id: string,
    currentHash: string,
    nextHash: string,
    expiresAt: Date,
    client: ClientInfo,
  ): Promise<boolean> {
    const [count] = await this.table.update(
      {
        tokenHash: nextHash,
        previousTokenHash: currentHash,
        rotatedAt: new Date(),
        expiresAt,
        ...clientColumns(client),
      },
      { where: { id, tokenHash: currentHash, revokedAt: null } },
    );
    return count > 0;
  }

  /**
   * Give the session a new token while keeping the token it replaced last and
   * when (so the reuse grace period is not extended). Only if it still holds
   * `currentHash` and is live.
   */
  async reissue(
    id: string,
    currentHash: string,
    nextHash: string,
    expiresAt: Date,
    client: ClientInfo,
  ): Promise<boolean> {
    const [count] = await this.table.update(
      { tokenHash: nextHash, expiresAt, ...clientColumns(client) },
      { where: { id, tokenHash: currentHash, revokedAt: null } },
    );
    return count > 0;
  }

  /** The account's live sessions, most recently active first. */
  async listActive(accountId: string): Promise<Omit<SessionInfo, "current">[]> {
    const rows = await this.table.findAll({
      where: { accountId, revokedAt: null, expiresAt: between(new Date()) },
      order: [["updatedAt", "DESC"]],
    });
    return rows.map(toSessionInfo);
  }

  /**
   * Revoke one live session; with `accountId`, only if it belongs to that account.
   * False when there was nothing to revoke.
   */
  async revoke(id: string, accountId?: string): Promise<boolean> {
    const where: Where = { id, revokedAt: null };
    if (accountId) where.accountId = accountId;
    const [count] = await this.table.update({ revokedAt: new Date() }, { where });
    return count > 0;
  }

  /** Revoke every live session of the account, optionally keeping one. */
  async revokeAll(accountId: string, exceptId?: string): Promise<void> {
    const where: Where = { accountId, revokedAt: null };
    if (exceptId) where.id = notEqual(exceptId);
    await this.table.update({ revokedAt: new Date() }, { where });
  }

  private async findOne(where: Where): Promise<StoredSession | null> {
    const row = await this.table.findOne({ where });
    return row ? (row.get({ plain: true }) as StoredSession) : null;
  }
}
