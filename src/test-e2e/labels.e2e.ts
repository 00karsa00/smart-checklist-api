import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Api, startApi } from "./support";

let api: Api;
beforeAll(async () => {
  api = await startApi();
});
afterAll(() => api.close());

// Categories and tags share one implementation; each case runs for both.
describe.each([
  { path: "/categories", prefix: "CATEGORY" },
  { path: "/tags", prefix: "TAG" },
])("$path", ({ path, prefix }) => {
  it("adds, renames, archives and deletes; names are unique per user", async () => {
    const { token } = await api.user();
    expect(await api.send("GET", path, undefined, token)).toEqual([]);
    const label = await api.send("POST", path, { name: " Urgent ", color: "#dc2626" }, token);
    expect(label).toMatchObject({ name: "Urgent", color: "#DC2626", isArchived: false });
    const clash = await api.call("POST", path, { name: "Urgent" }, token);
    expect([clash.status, clash.code]).toEqual([409, `${prefix}_NAME_TAKEN`]);

    const renamed = await api.send(
      "PATCH",
      `${path}/${label.id}`,
      { name: "Soon", color: "" },
      token,
    );
    expect(renamed).toMatchObject({ name: "Soon", color: null });
    await api.send("PATCH", `${path}/${label.id}`, { isArchived: true }, token);
    expect(await api.send("GET", path, undefined, token)).toEqual([]);
    expect(await api.send("GET", `${path}?includeArchived=true`, undefined, token)).toHaveLength(1);

    expect((await api.call("DELETE", `${path}/${label.id}`, undefined, token)).status).toBe(200);
    const gone = await api.call("PATCH", `${path}/${label.id}`, { name: "X" }, token);
    expect([gone.status, gone.code]).toEqual([404, `${prefix}_NOT_FOUND`]);
  });

  it("keeps each user's labels to themselves", async () => {
    const owner = await api.user();
    const other = await api.user();
    const label = await api.send("POST", path, { name: "Mine" }, owner.token);
    expect(
      (await api.call("PATCH", `${path}/${label.id}`, { name: "X" }, other.token)).status,
    ).toBe(404);
    expect((await api.call("DELETE", `${path}/${label.id}`, undefined, other.token)).status).toBe(
      404,
    );
    expect(await api.send("GET", path, undefined, other.token)).toEqual([]);
  });

  it("refuses what makes no sense", async () => {
    const { token } = await api.user();
    for (const body of [
      {},
      { name: "" },
      { name: "x".repeat(51) },
      { name: "A", color: "red" },
      { name: "A", kind: "tag" },
    ]) {
      expect((await api.call("POST", path, body, token)).status).toBe(400);
    }
  });
});

describe("the same name as a category and a tag", () => {
  it("is fine: they are different kinds", async () => {
    const { token } = await api.user();
    await api.send("POST", "/categories", { name: "Health" }, token);
    expect((await api.call("POST", "/tags", { name: "Health" }, token)).status).toBe(201);
  });
});

describe("suggested categories", () => {
  it("adds the set once, keeping what the user already has", async () => {
    const { token } = await api.user();
    await api.send("POST", "/categories", { name: "Health", color: "#000000" }, token);
    const list = await api.send("POST", "/categories/suggested", undefined, token);
    expect(list.map((item: any) => item.name)).toEqual([
      "Errands",
      "Family",
      "Finance",
      "Health",
      "Home",
      "Learning",
    ]);
    expect(list.find((item: any) => item.name === "Health").color).toBe("#000000");
    expect(await api.send("POST", "/categories/suggested", undefined, token)).toHaveLength(6);
    expect((await api.call("POST", "/tags/suggested", undefined, token)).status).toBe(404);
  });
});
