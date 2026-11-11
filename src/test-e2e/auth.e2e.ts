import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Api, PASSWORD, startApi } from "./support";

let api: Api;
beforeAll(async () => {
  api = await startApi();
});
afterAll(() => api.close());

describe("sign-up and sign-in", () => {
  it("registers, then signs in with email in two steps", async () => {
    const { email } = await api.user("Asha Rao");
    const identify = await api.call("POST", "/auth/user/identify", { identifier: email });
    expect(identify.status).toBe(200);
    expect(identify.data.loginMethod).toBe("password");

    const login = await api.call("POST", "/auth/user/login", {
      identifier: email.toUpperCase(),
      password: PASSWORD,
    });
    expect(login.status).toBe(200);
    expect(login.data.user.name).toBe("Asha Rao");
    const me = await api.call("GET", "/auth/user/me", undefined, login.data.accessToken);
    expect(me.data.email).toBe(email);
  });

  it("refuses a wrong password and an email already taken", async () => {
    const { email } = await api.user();
    expect(
      (await api.call("POST", "/auth/user/login", { identifier: email, password: "Wrong-pass1!" }))
        .status,
    ).toBe(401);
    const again = await api.call("POST", "/auth/user/register", {
      name: "X",
      email,
      password: PASSWORD,
    });
    expect(again.status).toBe(409);
  });

  it("keeps user and admin tokens apart", async () => {
    const user = await api.user();
    expect((await api.call("GET", "/admin/users", undefined, user.token)).status).toBe(403);
    expect((await api.call("GET", "/notifications")).status).toBe(401);
  });
});

describe("sessions", () => {
  it("rotates the refresh token; a just-replaced one gets a fresh pair; sign-out ends it", async () => {
    const { email } = await api.user();
    const first = (await api.login("user", email)).refreshToken;

    const refreshed = await api.call("POST", "/auth/user/refresh", { refreshToken: first });
    expect(refreshed.status).toBe(200);
    expect(refreshed.data.refreshToken).not.toBe(first);

    // Used again right away (a page left before keeping the reply, another tab):
    // the same session continues with a fresh pair, and that is the one that counts.
    const again = await api.call("POST", "/auth/user/refresh", { refreshToken: first });
    expect(again.status).toBe(200);
    const current = again.data.refreshToken;
    expect(current).not.toBe(refreshed.data.refreshToken);
    expect(
      (await api.call("POST", "/auth/user/refresh", { refreshToken: refreshed.data.refreshToken }))
        .status,
    ).toBe(401);

    const latest = (await api.send("POST", "/auth/user/refresh", { refreshToken: current }, ""))
      .refreshToken;
    expect((await api.call("POST", "/auth/user/logout", { refreshToken: latest })).status).toBe(
      200,
    );
    expect((await api.call("POST", "/auth/user/refresh", { refreshToken: latest })).status).toBe(
      401,
    );
  });

  it("never limits successful sign-ins", async () => {
    const { email } = await api.user();
    for (let i = 0; i < 12; i++) await api.login("user", email);
  });

  it("limits wrong passwords per account: the 11th try is refused with 429", async () => {
    const { email } = await api.user();
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      statuses.push(
        (
          await api.call("POST", "/auth/user/login", {
            identifier: email,
            password: `Wrong-pass${i}!`,
          })
        ).status,
      );
    }
    expect(statuses.slice(0, 10).every((status) => status === 401)).toBe(true);
    const last = await api.call("POST", "/auth/user/login", {
      identifier: email,
      password: PASSWORD,
    });
    expect(last.status).toBe(429);
    expect(last.code).toBe("TOO_MANY_REQUESTS");
    expect(last.message).toMatch(/Try again in \d+ minutes?/);
  });
});
