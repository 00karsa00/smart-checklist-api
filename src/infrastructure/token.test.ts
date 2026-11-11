import { describe, expect, it } from "vitest";

import { createRefreshToken, hashRefreshToken, signToken, verifyToken } from "./token";

describe("access tokens", () => {
  it("carry the account, its kind and the session", () => {
    const check = verifyToken(signToken("account-1", "admin", "session-1"));
    expect(check).toMatchObject({
      ok: true,
      claims: { sub: "account-1", kind: "admin", sid: "session-1" },
    });
  });

  it("leave out the session when none is given", () => {
    const check = verifyToken(signToken("account-1", "user"));
    expect(check.ok && check.claims.sid).toBeFalsy();
  });

  it("reject a tampered token", () => {
    const token = signToken("account-1", "admin");
    expect(verifyToken(`${token}x`)).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("refresh tokens", () => {
  it("are random and stored only as their hash", () => {
    const first = createRefreshToken();
    const second = createRefreshToken();

    expect(first.token).not.toBe(second.token);
    expect(first.hash).toBe(hashRefreshToken(first.token));
    expect(first.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(first.hash).not.toContain(first.token);
  });
});
