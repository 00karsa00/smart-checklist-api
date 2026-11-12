import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Api, startApi } from "./support";

let api: Api;
beforeAll(async () => {
  api = await startApi();
});
afterAll(() => api.close());

async function setUp() {
  const { token } = await api.user();
  const send = (method: string, path: string, body?: unknown) =>
    api.send(method, path, body, token);
  const [personal, work] = await send("GET", "/workspaces");
  const project = await send("POST", "/projects", { workspaceId: work.id, name: "Launch" });
  return { token, send, personal, work, project };
}
const titles = (list: any) => list.items.map((item: any) => item.title);

describe("notes", () => {
  it("adds a note with a checklist, in the first workspace by default", async () => {
    const { send, personal } = await setUp();
    const note = await send("POST", "/notes", {
      title: " Packing list ",
      body: "For the trip",
      items: [" Passport ", "Charger"],
    });
    expect(note).toMatchObject({
      title: "Packing list",
      body: "For the trip",
      workspaceId: personal.id,
      projectId: null,
      taskId: null,
      isPinned: false,
      checklist: { done: 0, total: 2 },
    });
    expect(note.items.map((item: any) => item.text)).toEqual(["Passport", "Charger"]);
  });

  it("ticks, edits, adds and removes checklist items", async () => {
    const { token, send } = await setUp();
    const note = await send("POST", "/notes", { title: "Groceries", items: ["Milk"] });
    const [milk] = note.items;
    let detail = await send("POST", `/notes/${note.id}/items`, { text: "Eggs" });
    expect(detail.items.map((item: any) => [item.text, item.position])).toEqual([
      ["Milk", 0],
      ["Eggs", 1],
    ]);
    detail = await send("PATCH", `/notes/${note.id}/items/${milk.id}`, {
      isDone: true,
      text: "Oat milk",
    });
    expect(detail.items[0]).toMatchObject({ text: "Oat milk", isDone: true });
    expect(detail.checklist).toEqual({ done: 1, total: 2 });
    detail = await send("DELETE", `/notes/${note.id}/items/${milk.id}`);
    expect(detail.items.map((item: any) => item.text)).toEqual(["Eggs"]);
    const gone = await api.call(
      "PATCH",
      `/notes/${note.id}/items/${milk.id}`,
      { isDone: false },
      token,
    );
    expect([gone.status, gone.code]).toEqual([404, "NOTE_ITEM_NOT_FOUND"]);
  });

  it("lists pinned first, then the latest; filters by place, task and words", async () => {
    const { send, work, project } = await setUp();
    const task = await send("POST", "/tasks", { title: "Write copy", projectId: project.id });
    await send("POST", "/notes", { title: "Old idea" });
    await send("POST", "/notes", { title: "Launch plan", projectId: project.id, taskId: task.id });
    await send("POST", "/notes", { title: "Team list", workspaceId: work.id, isPinned: true });
    const archived = await send("POST", "/notes", { title: "Archived" });
    await send("PATCH", `/notes/${archived.id}`, { isArchived: true });

    expect(titles(await send("GET", "/notes"))).toEqual(["Team list", "Launch plan", "Old idea"]);
    expect(titles(await send("GET", `/notes?workspaceId=${work.id}`))).toEqual([
      "Team list",
      "Launch plan",
    ]);
    expect(titles(await send("GET", `/notes?projectId=${project.id}`))).toEqual(["Launch plan"]);
    expect(titles(await send("GET", `/notes?taskId=${task.id}`))).toEqual(["Launch plan"]);
    expect((await send("GET", `/notes?taskId=${task.id}`)).items[0].taskTitle).toBe("Write copy");
    expect(titles(await send("GET", "/notes?q=%20PLAN%20"))).toEqual(["Launch plan"]);
    expect(titles(await send("GET", "/notes?includeArchived=true"))).toContain("Archived");
    // A changed checklist moves its note up.
    const old = (await send("GET", "/notes?q=Old")).items[0];
    await send("POST", `/notes/${old.id}/items`, { text: "Revisit" });
    expect(titles(await send("GET", "/notes"))[1]).toBe("Old idea");
  });

  it("moves, unlinks and follows deletes of tasks and projects", async () => {
    const { token, send, personal, work, project } = await setUp();
    const task = await send("POST", "/tasks", { title: "Call bank" });
    const note = await send("POST", "/notes", {
      title: "Bank call",
      projectId: project.id,
      taskId: task.id,
    });
    // Out of its project: it stays in that project's workspace.
    expect(await send("PATCH", `/notes/${note.id}`, { projectId: null })).toMatchObject({
      projectId: null,
      workspaceId: work.id,
    });
    expect(await send("PATCH", `/notes/${note.id}`, { workspaceId: personal.id })).toMatchObject({
      workspaceId: personal.id,
    });
    await send("DELETE", `/tasks/${task.id}`);
    expect((await send("GET", `/notes/${note.id}`)).taskId).toBeNull();

    const inProject = await send("POST", "/notes", { title: "Goes too", projectId: project.id });
    await send("DELETE", `/projects/${project.id}`);
    expect((await api.call("GET", `/notes/${inProject.id}`, undefined, token)).status).toBe(404);
    const busy = await api.call("DELETE", `/workspaces/${personal.id}`, undefined, token);
    expect([busy.status, busy.code]).toEqual([409, "WORKSPACE_NOT_EMPTY"]);
  });

  it("is found by search", async () => {
    const { send } = await setUp();
    await send("POST", "/notes", { title: "Book ideas", body: "Sci-fi, history" });
    const result = await send("GET", "/search?q=history");
    const notes = result.groups.find((group: any) => group.kind === "note");
    expect(notes.hits.map((hit: any) => hit.title)).toEqual(["Book ideas"]);
  });

  it("keeps each user's notes, and what they point at, to themselves", async () => {
    const owner = await setUp();
    const other = await setUp();
    const note = await owner.send("POST", "/notes", { title: "Private", items: ["x"] });
    for (const [method, path, body] of [
      ["GET", `/notes/${note.id}`, undefined],
      ["PATCH", `/notes/${note.id}`, { title: "Mine" }],
      ["DELETE", `/notes/${note.id}`, undefined],
      ["POST", `/notes/${note.id}/items`, { text: "y" }],
      ["PATCH", `/notes/${note.id}/items/${note.items[0].id}`, { isDone: true }],
    ] as const) {
      const result = await api.call(method, path, body, other.token);
      expect([result.status, result.code]).toEqual([404, "NOTE_NOT_FOUND"]);
    }
    const task = await owner.send("POST", "/tasks", { title: "Theirs" });
    for (const body of [
      { title: "X", projectId: owner.project.id },
      { title: "X", workspaceId: owner.work.id },
      { title: "X", taskId: task.id },
    ]) {
      expect((await api.call("POST", "/notes", body, other.token)).status).toBe(404);
    }
  });

  it("refuses what makes no sense", async () => {
    const { token, work, project } = await setUp();
    for (const body of [
      {},
      { title: "" },
      { title: "X", projectId: project.id, workspaceId: work.id },
      { title: "X", items: "milk" },
      { title: "X", items: [""] },
      { title: "X", isArchived: true },
      { title: "X", body: "x".repeat(20001) },
    ]) {
      expect((await api.call("POST", "/notes", body, token)).status).toBe(400);
    }
  });
});
