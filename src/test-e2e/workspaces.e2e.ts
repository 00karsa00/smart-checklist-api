import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { addDays } from "../common";
import { Api, startApi, todayIn } from "./support";

let api: Api;
beforeAll(async () => {
  api = await startApi();
});
afterAll(() => api.close());

const today = todayIn("Asia/Kolkata");

describe("workspaces", () => {
  it("starts every user with Personal and Work", async () => {
    const { token } = await api.user();
    const list = await api.send("GET", "/workspaces", undefined, token);
    expect(list.map((item: any) => item.name)).toEqual(["Personal", "Work"]);
    expect(list[0]).toMatchObject({ color: "#2563EB", openProjects: 0 });
    // Asking again does not add them twice.
    expect(await api.send("GET", "/workspaces", undefined, token)).toHaveLength(2);
  });

  it("adds, renames and removes; names are unique per user", async () => {
    const { token } = await api.user();
    await api.send("GET", "/workspaces", undefined, token);
    const added = await api.send(
      "POST",
      "/workspaces",
      { name: " Freelance ", color: "#ff8800" },
      token,
    );
    expect(added).toMatchObject({ name: "Freelance", color: "#FF8800" });
    const clash = await api.call("POST", "/workspaces", { name: "Work" }, token);
    expect([clash.status, clash.code]).toEqual([409, "WORKSPACE_NAME_TAKEN"]);

    const renamed = await api.send(
      "PATCH",
      `/workspaces/${added.id}`,
      { name: "Side work", color: null },
      token,
    );
    expect(renamed).toMatchObject({ name: "Side work", color: null });
    expect((await api.call("DELETE", `/workspaces/${added.id}`, undefined, token)).status).toBe(
      200,
    );
    expect(await api.send("GET", "/workspaces", undefined, token)).toHaveLength(2);
  });

  it("keeps a workspace with projects, and always one workspace", async () => {
    const { token } = await api.user();
    const [personal, work] = await api.send("GET", "/workspaces", undefined, token);
    await api.send("POST", "/projects", { workspaceId: work.id, name: "Launch" }, token);
    const busy = await api.call("DELETE", `/workspaces/${work.id}`, undefined, token);
    expect([busy.status, busy.code]).toEqual([409, "WORKSPACE_HAS_PROJECTS"]);

    expect((await api.call("DELETE", `/workspaces/${personal.id}`, undefined, token)).status).toBe(
      200,
    );
    const last = await api.call(
      "POST",
      "/projects",
      { workspaceId: personal.id, name: "X" },
      token,
    );
    expect(last.status).toBe(404);
  });

  it("keeps each user's workspaces to themselves", async () => {
    const owner = await api.user();
    const other = await api.user();
    const [personal] = await api.send("GET", "/workspaces", undefined, owner.token);
    for (const [method, path, body] of [
      ["PATCH", `/workspaces/${personal.id}`, { name: "Mine now" }],
      ["DELETE", `/workspaces/${personal.id}`, undefined],
      ["POST", "/projects", { workspaceId: personal.id, name: "Sneaky" }],
    ] as const) {
      const result = await api.call(method, path, body, other.token);
      expect([result.status, result.code]).toEqual([404, "WORKSPACE_NOT_FOUND"]);
    }
  });
});

describe("projects", () => {
  it("adds, lists in order, filters and counts open ones", async () => {
    const { token } = await api.user();
    const [personal, work] = await api.send("GET", "/workspaces", undefined, token);
    const add = (body: object) => api.send("POST", "/projects", body, token);
    const late = await add({ workspaceId: work.id, name: "Report", dueDate: addDays(today, -2) });
    await add({ workspaceId: work.id, name: "Website", dueDate: addDays(today, 10) });
    await add({ workspaceId: work.id, name: "Archive files", status: "completed" });
    await add({ workspaceId: personal.id, name: "Garden", status: "on_hold" });

    expect(late).toMatchObject({ name: "Report", status: "active", overdue: true });
    const all = await api.send("GET", "/projects", undefined, token);
    expect(all.map((item: any) => item.name)).toEqual([
      "Report",
      "Website",
      "Garden",
      "Archive files",
    ]);
    const workOnly = await api.send(
      "GET",
      `/projects?workspaceId=${work.id}&status=active`,
      undefined,
      token,
    );
    expect(workOnly.map((item: any) => item.name)).toEqual(["Report", "Website"]);

    const counts = await api.send("GET", "/workspaces", undefined, token);
    expect(counts.map((item: any) => item.openProjects)).toEqual([1, 2]);

    const clash = await api.call(
      "POST",
      "/projects",
      { workspaceId: work.id, name: "Website" },
      token,
    );
    expect([clash.status, clash.code]).toEqual([409, "PROJECT_NAME_TAKEN"]);
    // The same name is fine in another workspace.
    expect(
      (await api.call("POST", "/projects", { workspaceId: personal.id, name: "Website" }, token))
        .status,
    ).toBe(201);
  });

  it("edits, moves, archives and deletes", async () => {
    const { token } = await api.user();
    const [personal, work] = await api.send("GET", "/workspaces", undefined, token);
    const project = await api.send(
      "POST",
      "/projects",
      { workspaceId: work.id, name: "Move house", description: "Boxes", color: "#123abc" },
      token,
    );
    const edited = await api.send(
      "PATCH",
      `/projects/${project.id}`,
      {
        workspaceId: personal.id,
        description: "",
        status: "completed",
        dueDate: addDays(today, -1),
      },
      token,
    );
    expect(edited).toMatchObject({
      workspaceId: personal.id,
      description: null,
      color: "#123ABC",
      status: "completed",
      overdue: false,
    });

    await api.send("PATCH", `/projects/${project.id}`, { isArchived: true }, token);
    expect(await api.send("GET", "/projects", undefined, token)).toHaveLength(0);
    expect(await api.send("GET", "/projects?includeArchived=true", undefined, token)).toHaveLength(
      1,
    );

    expect((await api.call("DELETE", `/projects/${project.id}`, undefined, token)).status).toBe(
      200,
    );
    const gone = await api.call("GET", `/projects/${project.id}`, undefined, token);
    expect([gone.status, gone.code]).toEqual([404, "PROJECT_NOT_FOUND"]);
  });

  it("refuses what makes no sense", async () => {
    const { token } = await api.user();
    const [personal] = await api.send("GET", "/workspaces", undefined, token);
    for (const body of [
      { workspaceId: personal.id },
      { workspaceId: personal.id, name: "X", status: "done" },
      { workspaceId: personal.id, name: "X", dueDate: "tomorrow" },
      { workspaceId: personal.id, name: "X", color: "red" },
      { workspaceId: "nope", name: "X" },
      { workspaceId: personal.id, name: "X", isArchived: true },
    ]) {
      expect((await api.call("POST", "/projects", body, token)).status).toBe(400);
    }
    expect((await api.call("GET", "/projects?status=done", undefined, token)).status).toBe(400);
  });
});
