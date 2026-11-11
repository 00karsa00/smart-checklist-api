import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { configuration } from "../config/configuration";
import { AppUserSessionModel } from "../infrastructure/database";
import { Api, PASSWORD, startApi } from "./support";

let api: Api;
let superAdmin: string;

beforeAll(async () => {
  api = await startApi();
  superAdmin = (await api.admin("super_admin")).token;
});
afterAll(() => api.close());

describe("disabled accounts", () => {
  it("signs a disabled user out everywhere and refuses sign-in until enabled again", async () => {
    const user = await api.user();
    const session = await api.login("user", user.email);
    await api.send("PATCH", `/users/${user.id}`, { isActive: false }, superAdmin);

    expect((await api.call("GET", "/notifications", undefined, user.token)).status).toBe(401);
    expect(
      (await api.call("POST", "/auth/user/refresh", { refreshToken: session.refreshToken })).status,
    ).toBe(401);
    const login = await api.call("POST", "/auth/user/login", {
      identifier: user.email,
      password: PASSWORD,
    });
    expect(login).toMatchObject({ status: 403, code: "ACCOUNT_INACTIVE" });

    await api.send("PATCH", `/users/${user.id}`, { isActive: true }, superAdmin);
    expect(
      (await api.call("POST", "/auth/user/login", { identifier: user.email, password: PASSWORD }))
        .status,
    ).toBe(200);
  });

  it("does the same for a disabled admin", async () => {
    const other = await api.admin("admin");
    await api.send("PATCH", `/admin/users/${other.id}`, { isActive: false }, superAdmin);
    expect((await api.call("GET", "/users", undefined, other.token)).status).toBe(401);
    const login = await api.call("POST", "/auth/admin/login", {
      userName: other.userName,
      password: PASSWORD,
    });
    expect(login.code).toBe("ACCOUNT_INACTIVE");
  });
});

describe("stolen refresh tokens", () => {
  it("ends every session when a replaced token is used after the grace period", async () => {
    const user = await api.user();
    const phone = await api.login("user", user.email);
    const laptop = await api.login("user", user.email);
    const refreshed = await api.send(
      "POST",
      "/auth/user/refresh",
      { refreshToken: phone.refreshToken },
      "",
    );

    // Pretend the token was replaced two minutes ago (the grace period is one minute).
    // Only this test user's sessions are touched.
    await AppUserSessionModel.update(
      { rotatedAt: new Date(Date.now() - 2 * 60_000) },
      { where: { accountId: user.id } },
    );

    expect(
      (await api.call("POST", "/auth/user/refresh", { refreshToken: phone.refreshToken })).status,
    ).toBe(401);
    // Reuse looks like theft: the new token and the other device are signed out too.
    expect(
      (await api.call("POST", "/auth/user/refresh", { refreshToken: refreshed.refreshToken }))
        .status,
    ).toBe(401);
    expect(
      (await api.call("POST", "/auth/user/refresh", { refreshToken: laptop.refreshToken })).status,
    ).toBe(401);
  });
});

describe("registration switched off", () => {
  it("refuses sign-up, while admins can still add users", async () => {
    const before = configuration.auth.allowRegistration;
    configuration.auth.allowRegistration = false;
    try {
      const email = `e2e-closed-${Date.now()}@example.com`;
      const signUp = await api.call("POST", "/auth/user/register", {
        name: "No",
        email,
        password: PASSWORD,
      });
      expect(signUp).toMatchObject({ status: 403, code: "REGISTRATION_DISABLED" });

      await api.send(
        "POST",
        "/users",
        { name: "Added", email, loginMethod: "password", password: PASSWORD },
        superAdmin,
      );
      expect(
        (await api.call("POST", "/auth/user/login", { identifier: email, password: PASSWORD }))
          .status,
      ).toBe(200);
    } finally {
      configuration.auth.allowRegistration = before;
    }
  });
});
