import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Api, startApi } from "./support";

let api: Api;
beforeAll(async () => {
  api = await startApi();
});
afterAll(() => api.close());

const group = (result: any, kind: string) =>
  result.groups.find((item: any) => item.kind === kind)?.hits.map((hit: any) => hit.title) ?? [];

describe("search", () => {
  it("finds tasks, projects, workspaces, categories and tags, best match first", async () => {
    const { token } = await api.user();
    const send = (method: string, path: string, body?: unknown) =>
      api.send(method, path, body, token);
    const [personal] = await send("GET", "/workspaces");
    await send("POST", "/workspaces", { name: "Home office" });
    await send("POST", "/projects", { workspaceId: personal.id, name: "Home move" });
    await send("POST", "/projects", {
      workspaceId: personal.id,
      name: "Garden",
      description: "Around the home",
    });
    await send("POST", "/categories", { name: "Home" });
    await send("POST", "/tags", { name: "homework" });
    await send("POST", "/tasks", { title: "Clean the home", status: "done" });
    await send("POST", "/tasks", { title: "Home insurance" });
    await send("POST", "/tasks", { title: "Call plumber", notes: "Leak at home" });
    await send("POST", "/tasks", { title: "Buy milk" });

    const result = await send("GET", "/search?q=%20home%20");
    expect(result.query).toBe("home");
    expect(group(result, "task")).toEqual(["Home insurance", "Clean the home", "Call plumber"]);
    expect(group(result, "project")).toEqual(["Home move", "Garden"]);
    expect(group(result, "workspace")).toEqual(["Home office"]);
    expect(group(result, "category")).toEqual(["Home"]);
    expect(group(result, "tag")).toEqual(["homework"]);
    const task = result.groups.find((item: any) => item.kind === "task").hits[0];
    expect(task.data).toMatchObject({ status: "todo", workspaceId: personal.id });

    const none = await send("GET", "/search?q=zebra");
    expect(none.groups).toEqual([]);
  });

  it("only searches the user's own records", async () => {
    const owner = await api.user();
    const other = await api.user();
    await api.send("POST", "/tasks", { title: "Secret plan" }, owner.token);
    const result = await api.send("GET", "/search?q=secret", undefined, other.token);
    expect(result.groups).toEqual([]);
  });

  it("needs 2 to 100 characters", async () => {
    const { token } = await api.user();
    for (const q of ["", "a", " b ", "x".repeat(101)]) {
      const result = await api.call("GET", `/search?q=${q}`, undefined, token);
      expect(result.status).toBe(400);
    }
    expect((await api.call("GET", "/search?q=ab")).status).toBe(401);
  });
});
