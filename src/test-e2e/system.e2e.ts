import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Api, startApi } from "./support";

let api: Api;
let superAdmin: string;
let viewer: string;

beforeAll(async () => {
  api = await startApi();
  superAdmin = (await api.admin("super_admin")).token;
  viewer = (await api.admin("viewer")).token;
});
afterAll(() => api.close());

describe("system overview", () => {
  it("counts users and reports the server's health", async () => {
    const before = (await api.call("GET", "/system/overview", undefined, superAdmin)).data;
    expect(before.system.database.status).toBe("ok");
    expect(before.users.signupsByMonth).toHaveLength(12);
    await api.user();
    const after = (await api.call("GET", "/system/overview", undefined, viewer)).data;
    expect(after.users.total).toBe(before.users.total + 1);
  });

  it("is for admins only", async () => {
    const user = await api.user();
    expect((await api.call("GET", "/system/overview", undefined, user.token)).status).toBe(403);
  });
});

describe("audit log", () => {
  it("records account changes with before and after values, never passwords", async () => {
    const user = await api.user("Sys");
    await api.send(
      "PATCH",
      `/users/${user.id}`,
      { isActive: false, name: "Sys Renamed" },
      superAdmin,
    );
    await api.send("PATCH", `/users/${user.id}`, { name: "Sys Renamed" }, superAdmin);
    await api.send(
      "POST",
      `/users/${user.id}/reset-password`,
      { password: "Another-pass1!" },
      superAdmin,
    );

    const log = (
      await api.call("GET", `/system/audit-log?targetId=${user.id}`, undefined, superAdmin)
    ).data;
    expect(log.items.map((entry: any) => entry.action)).toEqual([
      "user.reset_password",
      "user.update",
    ]);
    expect(log.items[1].details.changes).toEqual({
      name: { from: "Sys", to: "Sys Renamed" },
      isActive: { from: true, to: false },
    });
    expect(log.items[1].ipAddress).toBe("127.0.0.1");
    expect(JSON.stringify(log)).not.toContain("Another-pass1!");
  });

  it("is for super admins only", async () => {
    expect((await api.call("GET", "/system/audit-log", undefined, viewer)).status).toBe(403);
  });
});
