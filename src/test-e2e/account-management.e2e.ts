import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Api, PASSWORD, startApi } from "./support";

let api: Api;
let superAdmin: { token: string; userName: string; id: string };

beforeAll(async () => {
  api = await startApi();
  superAdmin = await api.admin("super_admin");
});
afterAll(() => api.close());

const name = (label: string) => `e2e-${label}-${Date.now().toString(36)}`;

describe("managing admins", () => {
  it("adds an admin; the name must be free", async () => {
    const userName = name("ops");
    const created = await api.call(
      "POST",
      "/admin/users",
      { userName, loginMethod: "password", password: PASSWORD, role: "viewer" },
      superAdmin.token,
    );
    expect(created).toMatchObject({
      status: 201,
      data: { userName, role: "viewer", isActive: true },
    });
    const again = await api.call(
      "POST",
      "/admin/users",
      { userName, loginMethod: "password", password: PASSWORD },
      superAdmin.token,
    );
    expect(again.status).toBe(409);
  });

  it("applies a role change at once, to an admin already signed in", async () => {
    const viewer = await api.admin("viewer");
    const newUser = () => ({
      name: "Via admin",
      email: `${name("u")}@example.com`,
      loginMethod: "password",
      password: PASSWORD,
    });
    expect((await api.call("POST", "/users", newUser(), viewer.token)).status).toBe(403);
    await api.send("PATCH", `/admin/users/${viewer.id}`, { role: "admin" }, superAdmin.token);
    expect((await api.call("POST", "/users", newUser(), viewer.token)).status).toBe(201);
  });

  it("will not let an admin lock themselves out or promote themselves", async () => {
    const self = (body: object) =>
      api.call("PATCH", `/admin/users/${superAdmin.id}`, body, superAdmin.token);
    expect((await self({ isActive: false })).code).toBe("ADMIN_CANNOT_DEACTIVATE_SELF");
    expect((await self({ role: "viewer" })).code).toBe("ADMIN_CANNOT_CHANGE_OWN_ROLE");
  });

  it("resets an admin's password: the old one stops working and sessions end", async () => {
    const admin = await api.admin("admin");
    const session = await api.login("admin", admin.userName);
    await api.send(
      "POST",
      `/admin/users/${admin.id}/reset-password`,
      { password: "Reset-pass1!" },
      superAdmin.token,
    );
    expect(
      (await api.call("POST", "/auth/admin/refresh", { refreshToken: session.refreshToken }))
        .status,
    ).toBe(401);
    expect(
      (
        await api.call("POST", "/auth/admin/login", {
          userName: admin.userName,
          password: PASSWORD,
        })
      ).status,
    ).toBe(401);
    await api.login("admin", admin.userName, "Reset-pass1!");
  });

  it("keeps admin management to super admins", async () => {
    const admin = await api.admin("admin");
    expect((await api.call("GET", "/admin/users", undefined, admin.token)).status).toBe(403);
    expect((await api.call("GET", "/admin/login-logs", undefined, admin.token)).status).toBe(403);
  });
});

describe("managing users", () => {
  it("adds, finds and edits a user; a changed email is no longer verified", async () => {
    const admin = await api.admin("admin");
    const email = `${name("ravi")}@example.com`;
    const created = await api.send(
      "POST",
      "/users",
      { name: "Ravi K", email, loginMethod: "password", password: PASSWORD, isEmailVerified: true },
      admin.token,
    );
    const found = await api.call(
      "GET",
      `/users?search=${encodeURIComponent(email)}`,
      undefined,
      admin.token,
    );
    expect(found.data.items.map((user: any) => user.id)).toEqual([created.id]);

    const newEmail = `${name("ravi2")}@example.com`;
    const edited = await api.send(
      "PATCH",
      `/users/${created.id}`,
      { name: "Ravi Kumar", email: newEmail },
      admin.token,
    );
    expect(edited).toMatchObject({ name: "Ravi Kumar", email: newEmail, isEmailVerified: false });
    const noContact = await api.call(
      "PATCH",
      `/users/${created.id}`,
      { email: null, phone: null },
      admin.token,
    );
    expect(noContact.status).toBe(400);
  });

  it("resets a user's password", async () => {
    const user = await api.user();
    await api.send(
      "POST",
      `/users/${user.id}/reset-password`,
      { password: "Reset-pass1!" },
      superAdmin.token,
    );
    expect((await api.call("GET", "/notifications", undefined, user.token)).status).toBe(200);
    await api.login("user", user.email, "Reset-pass1!");
    expect(
      (await api.call("POST", "/auth/user/login", { identifier: user.email, password: PASSWORD }))
        .status,
    ).toBe(401);
  });

  it("lets a viewer look but not change", async () => {
    const viewer = await api.admin("viewer");
    const user = await api.user();
    expect((await api.call("GET", `/users/${user.id}`, undefined, viewer.token)).status).toBe(200);
    expect(
      (await api.call("PATCH", `/users/${user.id}`, { name: "No" }, viewer.token)).status,
    ).toBe(403);
    expect(
      (
        await api.call(
          "POST",
          `/users/${user.id}/reset-password`,
          { password: "Reset-pass1!" },
          viewer.token,
        )
      ).status,
    ).toBe(403);
  });
});

describe("login logs", () => {
  it("records failed and successful sign-ins, filterable", async () => {
    const user = await api.user();
    await api.call("POST", "/auth/user/login", {
      identifier: user.email,
      password: "Wrong-pass1!",
    });
    await api.login("user", user.email);
    const failed = await api.call(
      "GET",
      `/users/login-logs?search=${encodeURIComponent(user.email)}&status=failed`,
      undefined,
      superAdmin.token,
    );
    expect(failed.data.items).toHaveLength(1);
    expect(failed.data.items[0]).toMatchObject({ isSuccess: false, identifier: user.email });
    const all = await api.call(
      "GET",
      `/users/login-logs?search=${encodeURIComponent(user.email)}`,
      undefined,
      superAdmin.token,
    );
    expect(all.data.items.length).toBeGreaterThanOrEqual(2);

    const admins = await api.call(
      "GET",
      `/admin/login-logs?search=${superAdmin.userName}`,
      undefined,
      superAdmin.token,
    );
    expect(admins.data.items.some((log: any) => log.isSuccess)).toBe(true);
  });
});
