import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Api, PASSWORD, startApi } from "./support";

let api: Api;
beforeAll(async () => {
  api = await startApi();
});
afterAll(() => api.close());

describe("profile", () => {
  it("changes name and email; an email in use is refused", async () => {
    const user = await api.user("Asha");
    const other = await api.user();
    const newEmail = `e2e-new-${Date.now()}@example.com`;
    await api.send("PATCH", "/profile/user", { name: "Asha Rao", email: newEmail }, user.token);
    const me = (await api.call("GET", "/auth/user/me", undefined, user.token)).data;
    expect(me).toMatchObject({ name: "Asha Rao", email: newEmail });
    const taken = await api.call("PATCH", "/profile/user", { email: other.email }, user.token);
    expect(taken.status).toBe(409);
  });
});

describe("settings", () => {
  it("starts from the defaults and saves changes", async () => {
    const user = await api.user();
    const settings = (await api.call("GET", "/profile/user/settings", undefined, user.token)).data;
    expect(settings).toMatchObject({ currency: "INR", timeZone: "Asia/Kolkata", weekStartsOn: 1 });

    // The app sends every field, the unchanged default time zone included.
    const saved = await api.send(
      "PATCH",
      "/profile/user/settings",
      { ...settings, currency: "usd", weekStartsOn: 0 },
      user.token,
    );
    expect(saved).toMatchObject({ currency: "USD", weekStartsOn: 0, timeZone: "Asia/Kolkata" });
  });

  it("refuses settings that make no sense", async () => {
    const user = await api.user();
    for (const body of [{ timeZone: "Mars/Base" }, { currency: "XYZ1" }, { weekStartsOn: 7 }]) {
      expect((await api.call("PATCH", "/profile/user/settings", body, user.token)).status).toBe(
        400,
      );
    }
  });
});

describe("password and devices", () => {
  it("changes the password: a wrong current one changes nothing; other devices are signed out", async () => {
    const user = await api.user();
    const here = await api.login("user", user.email);
    const elsewhere = await api.login("user", user.email);

    const wrong = await api.call(
      "POST",
      "/profile/user/password",
      { currentPassword: "Wrong-pass1!", newPassword: "Next-pass1!" },
      here.accessToken,
    );
    expect(wrong).toMatchObject({ status: 400, code: "CURRENT_PASSWORD_INCORRECT" });
    expect((await api.call("GET", "/notifications", undefined, here.accessToken)).status).toBe(200);

    await api.send(
      "POST",
      "/profile/user/password",
      { currentPassword: PASSWORD, newPassword: "Next-pass1!" },
      here.accessToken,
    );
    expect(
      (await api.call("POST", "/auth/user/refresh", { refreshToken: elsewhere.refreshToken }))
        .status,
    ).toBe(401);
    expect(
      (await api.call("POST", "/auth/user/refresh", { refreshToken: here.refreshToken })).status,
    ).toBe(200);
    expect(
      (await api.call("POST", "/auth/user/login", { identifier: user.email, password: PASSWORD }))
        .status,
    ).toBe(401);
    await api.login("user", user.email, "Next-pass1!");
  });

  it("lists devices and signs one or all others out", async () => {
    const user = await api.user();
    const here = await api.login("user", user.email);
    const tablet = await api.login("user", user.email);
    await api.login("user", user.email);

    const devices = (await api.call("GET", "/profile/user/sessions", undefined, here.accessToken))
      .data;
    expect(devices.filter((device: any) => device.current)).toHaveLength(1);
    expect(devices.length).toBeGreaterThanOrEqual(4);

    const tabletId = devices.find((device: any) => !device.current)?.id;
    expect(
      (await api.call("DELETE", `/profile/user/sessions/${tabletId}`, undefined, here.accessToken))
        .status,
    ).toBe(200);
    await api.send("POST", "/profile/user/sessions/sign-out-others", {}, here.accessToken);
    const left = (await api.call("GET", "/profile/user/sessions", undefined, here.accessToken))
      .data;
    expect(left).toHaveLength(1);
    expect(left[0].current).toBe(true);
    expect(
      (await api.call("POST", "/auth/user/refresh", { refreshToken: tablet.refreshToken })).status,
    ).toBe(401);
  });

  it("works the same for admins", async () => {
    const admin = await api.admin("viewer");
    const result = await api.call(
      "POST",
      "/profile/admin/password",
      { currentPassword: PASSWORD, newPassword: "Next-pass1!" },
      admin.token,
    );
    expect(result.status).toBe(200);
    await api.login("admin", admin.userName, "Next-pass1!");
  });
});
