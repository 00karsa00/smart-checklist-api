// In-memory stand-ins for repositories and request contexts, for unit tests.
// Excluded from the build (tsconfig.build.json).
import { AnyHttpContext } from "../infrastructure/http";

import {
  AccountSecrets,
  LoginLogEntry,
  LoginLogRepository,
  PasswordRepository,
  SessionRepository,
} from "../modules/accounts";
import { toSessionInfo } from "../modules/accounts/session.repository";
import { ClientInfo, StoredSession } from "../modules/accounts/types/account.type";

type SessionRow = StoredSession & {
  tokenHash: string;
  previousTokenHash: string | null;
  createdAt: Date;
} & ClientInfo;

/** Sessions kept in a Map; `rows` is exposed so tests can inspect or age them. */
export function fakeSessions() {
  const rows = new Map<string, SessionRow>();
  let next = 0;
  const find = (match: (row: SessionRow) => boolean) => [...rows.values()].find(match) ?? null;

  const repo = {
    async create(accountId: string, tokenHash: string, expiresAt: Date, client: ClientInfo) {
      const id = `session-${++next}`;
      rows.set(id, {
        id,
        accountId,
        tokenHash,
        previousTokenHash: null,
        expiresAt,
        revokedAt: null,
        rotatedAt: null,
        createdAt: new Date(),
        ...client,
      });
      return id;
    },
    async findByHash(tokenHash: string) {
      return find((row) => row.tokenHash === tokenHash);
    },
    async findByPreviousHash(tokenHash: string) {
      return find((row) => row.previousTokenHash === tokenHash);
    },
    async rotate(id: string, currentHash: string, nextHash: string, expiresAt: Date) {
      const row = rows.get(id);
      if (!row || row.revokedAt || row.tokenHash !== currentHash) return false;
      Object.assign(row, {
        tokenHash: nextHash,
        previousTokenHash: currentHash,
        rotatedAt: new Date(),
        expiresAt,
      });
      return true;
    },
    async reissue(id: string, currentHash: string, nextHash: string, expiresAt: Date) {
      const row = rows.get(id);
      if (!row || row.revokedAt || row.tokenHash !== currentHash) return false;
      Object.assign(row, { tokenHash: nextHash, expiresAt });
      return true;
    },
    async listActive(accountId: string) {
      return [...rows.values()]
        .filter(
          (row) => row.accountId === accountId && !row.revokedAt && row.expiresAt > new Date(),
        )
        .map(toSessionInfo);
    },
    async revoke(id: string, accountId?: string) {
      const row = rows.get(id);
      if (!row || row.revokedAt || (accountId && row.accountId !== accountId)) return false;
      row.revokedAt = new Date();
      return true;
    },
    async revokeAll(accountId: string, exceptId?: string) {
      for (const row of rows.values()) {
        if (row.accountId === accountId && !row.revokedAt && row.id !== exceptId) {
          row.revokedAt = new Date();
        }
      }
    },
  };
  return { rows, repo: repo as unknown as SessionRepository };
}

/** Password hashes kept in a Map. */
export function fakePasswords() {
  const hashes = new Map<string, string>();
  const repo = {
    async findHash(accountId: string) {
      return hashes.get(accountId) ?? null;
    },
    async saveHash(accountId: string, hash: string) {
      hashes.set(accountId, hash);
    },
  };
  return { hashes, repo: repo as unknown as PasswordRepository };
}

/** AccountSecrets over fakes, with the fakes exposed. */
export function fakeSecrets() {
  const passwords = fakePasswords();
  const sessions = fakeSessions();
  const logins: LoginLogEntry[] = [];
  const loginLogs = {
    async create(entry: LoginLogEntry) {
      logins.push(entry);
    },
  } as unknown as LoginLogRepository;

  return {
    secrets: new AccountSecrets(passwords.repo, loginLogs, sessions.repo),
    passwords,
    sessions,
    logins,
  };
}

/** A request context for running guards. */
export function fakeContext(parts: Partial<AnyHttpContext> = {}): AnyHttpContext {
  return {
    params: {},
    query: {},
    body: {},
    requestId: "test",
    ip: "127.0.0.1",
    header: () => undefined,
    ...parts,
  } as AnyHttpContext;
}

export const CLIENT: ClientInfo = { ipAddress: "127.0.0.1", userAgent: "vitest" };
