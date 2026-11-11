import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES } from "../../common";
import { hashPassword } from "../../infrastructure/password";
import { CLIENT, fakeSecrets } from "../../test-support/fakes";

const ACCOUNT = "account-1";

async function withPassword(password = "Current#123") {
  const fakes = fakeSecrets();
  fakes.passwords.hashes.set(ACCOUNT, await hashPassword(password));
  return fakes;
}

describe("AccountSecrets.changePassword", () => {
  it("refuses a wrong current password with 400, not 401", async () => {
    const { secrets } = await withPassword();
    await expect(secrets.changePassword(ACCOUNT, "Wrong#123", "Another#123")).rejects.toMatchObject(
      { statusCode: 400, code: ERROR_CODES.CURRENT_PASSWORD_INCORRECT },
    );
  });

  it("refuses the same password again", async () => {
    const { secrets } = await withPassword();
    await expect(
      secrets.changePassword(ACCOUNT, "Current#123", "Current#123"),
    ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_ERROR });
  });

  it("saves the new password and ends every other session", async () => {
    const { secrets } = await withPassword();
    const mine = await secrets.startSession(ACCOUNT, CLIENT);
    const other = await secrets.startSession(ACCOUNT, CLIENT);

    await secrets.changePassword(ACCOUNT, "Current#123", "Another#123", mine.sessionId);

    expect(await secrets.passwordMatches(ACCOUNT, "Another#123")).toBe(true);
    expect(await secrets.passwordMatches(ACCOUNT, "Current#123")).toBe(false);
    await expect(secrets.rotateSession(mine.refreshToken, CLIENT)).resolves.toBeTruthy();
    await expect(secrets.rotateSession(other.refreshToken, CLIENT)).rejects.toMatchObject({
      code: ERROR_CODES.REFRESH_TOKEN_INVALID,
    });
  });
});

describe("AccountSecrets.resetPassword", () => {
  it("ends every session of the account", async () => {
    const { secrets } = await withPassword();
    const session = await secrets.startSession(ACCOUNT, CLIENT);

    await secrets.resetPassword(ACCOUNT, "Reset#1234");

    await expect(secrets.rotateSession(session.refreshToken, CLIENT)).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});

describe("AccountSecrets sessions", () => {
  it("rotates: the new token works, the old one only briefly", async () => {
    vi.useFakeTimers();
    try {
      const { secrets } = fakeSecrets();
      const first = await secrets.startSession(ACCOUNT, CLIENT);

      const second = await secrets.rotateSession(first.refreshToken, CLIENT);
      expect(second.accountId).toBe(ACCOUNT);
      expect(second.sessionId).toBe(first.sessionId);
      expect(second.refreshToken).not.toBe(first.refreshToken);

      vi.advanceTimersByTime(2 * 60 * 1000);
      await expect(secrets.rotateSession(first.refreshToken, CLIENT)).rejects.toMatchObject({
        code: ERROR_CODES.REFRESH_TOKEN_INVALID,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("refuses an unknown token", async () => {
    const { secrets } = fakeSecrets();
    await expect(secrets.rotateSession("not-a-token", CLIENT)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("refuses an expired token", async () => {
    const { secrets, sessions } = fakeSecrets();
    const session = await secrets.startSession(ACCOUNT, CLIENT);
    sessions.rows.get(session.sessionId)!.expiresAt = new Date(Date.now() - 1000);

    await expect(secrets.rotateSession(session.refreshToken, CLIENT)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("gives a used token that comes back quickly a fresh pair (another tab, a lost reply)", async () => {
    const { secrets } = fakeSecrets();
    const other = await secrets.startSession(ACCOUNT, CLIENT);
    const first = await secrets.startSession(ACCOUNT, CLIENT);
    const second = await secrets.rotateSession(first.refreshToken, CLIENT);

    // The reply carrying `second` never arrived; the old token is used again.
    const again = await secrets.rotateSession(first.refreshToken, CLIENT);
    expect(again.sessionId).toBe(first.sessionId);
    expect(again.refreshToken).not.toBe(second.refreshToken);
    await expect(secrets.rotateSession(again.refreshToken, CLIENT)).resolves.toBeTruthy();
    // Nothing else is touched.
    await expect(secrets.rotateSession(other.refreshToken, CLIENT)).resolves.toBeTruthy();
  });

  it("does not extend the grace period by quick reuses", async () => {
    vi.useFakeTimers();
    try {
      const { secrets } = fakeSecrets();
      const first = await secrets.startSession(ACCOUNT, CLIENT);
      await secrets.rotateSession(first.refreshToken, CLIENT);
      vi.advanceTimersByTime(40 * 1000);
      const again = await secrets.rotateSession(first.refreshToken, CLIENT);
      vi.advanceTimersByTime(40 * 1000);

      // 80 s after the replacement: theft, so the session ends.
      await expect(secrets.rotateSession(first.refreshToken, CLIENT)).rejects.toBeTruthy();
      await expect(secrets.rotateSession(again.refreshToken, CLIENT)).rejects.toMatchObject({
        code: ERROR_CODES.REFRESH_TOKEN_INVALID,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("ends every session when a used token comes back later (likely stolen)", async () => {
    vi.useFakeTimers();
    try {
      const { secrets } = fakeSecrets();
      const first = await secrets.startSession(ACCOUNT, CLIENT);
      const second = await secrets.rotateSession(first.refreshToken, CLIENT);

      vi.advanceTimersByTime(5 * 60 * 1000);
      await expect(secrets.rotateSession(first.refreshToken, CLIENT)).rejects.toBeTruthy();

      await expect(secrets.rotateSession(second.refreshToken, CLIENT)).rejects.toMatchObject({
        code: ERROR_CODES.REFRESH_TOKEN_INVALID,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("treats a token from two refreshes ago as unknown (no lock-out)", async () => {
    vi.useFakeTimers();
    try {
      const { secrets } = fakeSecrets();
      const first = await secrets.startSession(ACCOUNT, CLIENT);
      const second = await secrets.rotateSession(first.refreshToken, CLIENT);
      const third = await secrets.rotateSession(second.refreshToken, CLIENT);

      vi.advanceTimersByTime(5 * 60 * 1000);
      await expect(secrets.rotateSession(first.refreshToken, CLIENT)).rejects.toBeTruthy();

      await expect(secrets.rotateSession(third.refreshToken, CLIENT)).resolves.toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("lists live sessions and marks the current one", async () => {
    const { secrets } = fakeSecrets();
    const mine = await secrets.startSession(ACCOUNT, CLIENT);
    const other = await secrets.startSession(ACCOUNT, CLIENT);
    const ended = await secrets.startSession(ACCOUNT, CLIENT);
    await secrets.startSession("someone-else", CLIENT);
    await secrets.endSession(ended.refreshToken);

    const sessions = await secrets.listSessions(ACCOUNT, mine.sessionId);

    expect(sessions.map((session) => [session.id, session.current])).toEqual([
      [mine.sessionId, true],
      [other.sessionId, false],
    ]);
  });

  it("signs out one of your own devices, never someone else's", async () => {
    const { secrets } = fakeSecrets();
    const mine = await secrets.startSession(ACCOUNT, CLIENT);
    const theirs = await secrets.startSession("someone-else", CLIENT);

    await expect(secrets.endSessionById(ACCOUNT, theirs.sessionId)).rejects.toMatchObject({
      statusCode: 404,
      code: ERROR_CODES.SESSION_NOT_FOUND,
    });
    await secrets.endSessionById(ACCOUNT, mine.sessionId);
    await expect(secrets.endSessionById(ACCOUNT, mine.sessionId)).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(secrets.rotateSession(theirs.refreshToken, CLIENT)).resolves.toBeTruthy();
  });

  it("logout ends the session and is safe to repeat", async () => {
    const { secrets } = fakeSecrets();
    const session = await secrets.startSession(ACCOUNT, CLIENT);

    await secrets.endSession(session.refreshToken);
    await secrets.endSession(session.refreshToken);
    await secrets.endSession("unknown");

    await expect(secrets.rotateSession(session.refreshToken, CLIENT)).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
