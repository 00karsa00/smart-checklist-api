import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { addDays } from "../common";
import { Api, startApi, todayIn } from "./support";

let api: Api;
beforeAll(async () => {
  api = await startApi();
});
afterAll(() => api.close());

const today = todayIn("Asia/Kolkata");

/** A new user with their two starter workspaces and a project in Work. */
async function setUp() {
  const { token } = await api.user();
  const send = (method: string, path: string, body?: unknown) =>
    api.send(method, path, body, token);
  const [personal, work] = await send("GET", "/workspaces");
  const project = await send("POST", "/projects", { workspaceId: work.id, name: "Launch" });
  return { token, send, personal, work, project };
}

const titles = (list: any) => list.items.map((item: any) => item.title);

describe("tasks", () => {
  it("adds a task to the first workspace by default, with every detail", async () => {
    const { send, personal, project } = await setUp();
    const plain = await send("POST", "/tasks", { title: " Buy milk " });
    expect(plain).toMatchObject({
      title: "Buy milk",
      status: "todo",
      priority: "none",
      workspaceId: personal.id,
      projectId: null,
      tagIds: [],
      overdue: false,
      subtasks: { done: 0, total: 0 },
      children: [],
    });

    const category = await send("POST", "/categories", { name: "Work stuff" });
    const tag = await send("POST", "/tags", { name: "urgent" });
    const full = await send("POST", "/tasks", {
      title: "Write the press release",
      notes: "Two pages",
      priority: "high",
      status: "in_progress",
      dueDate: addDays(today, -1),
      dueTime: "09:30",
      projectId: project.id,
      categoryId: category.id,
      tagIds: [tag.id, tag.id],
    });
    expect(full).toMatchObject({
      priority: "high",
      status: "in_progress",
      dueTime: "09:30",
      projectId: project.id,
      workspaceId: project.workspaceId,
      categoryId: category.id,
      tagIds: [tag.id],
      overdue: true,
    });
  });

  it("lists open tasks soonest first, then by priority; filters each way", async () => {
    const { send, personal, work, project } = await setUp();
    const tag = await send("POST", "/tags", { name: "waiting" });
    const add = (body: object) => send("POST", "/tasks", body);
    await add({ title: "Later", dueDate: addDays(today, 5) });
    await add({ title: "Today low", dueDate: today, priority: "low" });
    await add({ title: "Today high", dueDate: today, priority: "high", tagIds: [tag.id] });
    await add({ title: "Late", dueDate: addDays(today, -3), projectId: project.id });
    await add({ title: "Someday", workspaceId: work.id });
    const done = await add({ title: "Finished", status: "done" });
    expect(done.completedAt).not.toBeNull();

    expect(titles(await send("GET", "/tasks"))).toEqual([
      "Late",
      "Today high",
      "Today low",
      "Later",
      "Someday",
    ]);
    expect(titles(await send("GET", "/tasks?includeDone=true"))).toContain("Finished");
    expect(titles(await send("GET", "/tasks?due=today"))).toEqual(["Today high", "Today low"]);
    expect(titles(await send("GET", "/tasks?due=overdue"))).toEqual(["Late"]);
    expect(titles(await send("GET", "/tasks?due=upcoming"))).toEqual(["Later"]);
    expect(titles(await send("GET", "/tasks?due=none"))).toEqual(["Someday"]);
    expect(titles(await send("GET", `/tasks?tagId=${tag.id}`))).toEqual(["Today high"]);
    expect(titles(await send("GET", `/tasks?projectId=${project.id}`))).toEqual(["Late"]);
    // A workspace holds its own tasks and those of its projects.
    expect(titles(await send("GET", `/tasks?workspaceId=${work.id}`))).toEqual(["Late", "Someday"]);
    expect(titles(await send("GET", `/tasks?workspaceId=${personal.id}`))).toEqual([
      "Today high",
      "Today low",
      "Later",
    ]);
    expect(titles(await send("GET", "/tasks?q=HIGH"))).toEqual(["Today high"]);
    const page = await send("GET", "/tasks?limit=2&page=2");
    expect([titles(page), page.pagination.total]).toEqual([["Today low", "Later"], 5]);
  });

  it("completes and reopens; edits move it between projects and workspaces", async () => {
    const { send, personal, work, project } = await setUp();
    const task = await send("POST", "/tasks", { title: "Call bank", projectId: project.id });
    const done = await send("PATCH", `/tasks/${task.id}`, { status: "done" });
    expect(done.completedAt).not.toBeNull();
    const reopened = await send("PATCH", `/tasks/${task.id}`, { status: "todo" });
    expect(reopened.completedAt).toBeNull();

    // Out of the project: it stays in the project's workspace.
    expect(await send("PATCH", `/tasks/${task.id}`, { projectId: null })).toMatchObject({
      projectId: null,
      workspaceId: work.id,
    });
    expect(await send("PATCH", `/tasks/${task.id}`, { workspaceId: personal.id })).toMatchObject({
      workspaceId: personal.id,
    });
    // Moving the project moves its tasks with it.
    await send("PATCH", `/tasks/${task.id}`, { projectId: project.id });
    await send("PATCH", `/projects/${project.id}`, { workspaceId: personal.id });
    expect((await send("GET", `/tasks/${task.id}`)).workspaceId).toBe(personal.id);

    const dated = await send("PATCH", `/tasks/${task.id}`, { dueDate: today, dueTime: "18:00" });
    expect(dated.dueTime).toBe("18:00");
    expect(await send("PATCH", `/tasks/${task.id}`, { dueDate: null })).toMatchObject({
      dueDate: null,
      dueTime: null,
    });
  });

  it("keeps subtasks with their task, one level deep", async () => {
    const { token, send, work } = await setUp();
    const task = await send("POST", "/tasks", { title: "Move house", workspaceId: work.id });
    const pack = await send("POST", "/tasks", { title: "Pack books", parentId: task.id });
    await send("POST", "/tasks", { title: "Book van", parentId: task.id, status: "done" });
    expect(pack).toMatchObject({ parentId: task.id, workspaceId: work.id, projectId: null });

    const detail = await send("GET", `/tasks/${task.id}`);
    expect(detail.subtasks).toEqual({ done: 1, total: 2 });
    expect(detail.children.map((child: any) => child.title)).toEqual(["Pack books", "Book van"]);
    // Subtasks are not listed on their own.
    expect(titles(await send("GET", "/tasks?includeDone=true"))).toEqual(["Move house"]);

    for (const [method, path, body] of [
      ["POST", "/tasks", { title: "Deeper", parentId: pack.id }],
      ["POST", "/tasks", { title: "X", parentId: task.id, workspaceId: work.id }],
      ["PATCH", `/tasks/${pack.id}`, { workspaceId: work.id }],
    ] as const) {
      expect((await api.call(method, path, body, token)).status).toBe(400);
    }

    expect((await api.call("DELETE", `/tasks/${task.id}`, undefined, token)).status).toBe(200);
    expect((await api.call("GET", `/tasks/${pack.id}`, undefined, token)).status).toBe(404);
  });

  it("follows what happens to projects, categories, tags and workspaces", async () => {
    const { token, send, work, project } = await setUp();
    const category = await send("POST", "/categories", { name: "Home" });
    const tag = await send("POST", "/tags", { name: "later" });
    const inProject = await send("POST", "/tasks", { title: "A", projectId: project.id });
    const loose = await send("POST", "/tasks", {
      title: "B",
      workspaceId: work.id,
      categoryId: category.id,
      tagIds: [tag.id],
    });

    await send("DELETE", `/categories/${category.id}`);
    await send("DELETE", `/tags/${tag.id}`);
    expect(await send("GET", `/tasks/${loose.id}`)).toMatchObject({ categoryId: null, tagIds: [] });

    await send("DELETE", `/projects/${project.id}`);
    expect((await api.call("GET", `/tasks/${inProject.id}`, undefined, token)).status).toBe(404);

    const busy = await api.call("DELETE", `/workspaces/${work.id}`, undefined, token);
    expect([busy.status, busy.code]).toEqual([409, "WORKSPACE_NOT_EMPTY"]);
  });

  it("keeps each user's tasks, and what they point at, to themselves", async () => {
    const owner = await setUp();
    const other = await setUp();
    const task = await owner.send("POST", "/tasks", { title: "Private" });
    const otherTag = await other.send("POST", "/tags", { name: "theirs" });
    for (const [method, path, body] of [
      ["GET", `/tasks/${task.id}`, undefined],
      ["PATCH", `/tasks/${task.id}`, { title: "Mine" }],
      ["DELETE", `/tasks/${task.id}`, undefined],
      ["POST", "/tasks", { title: "Sub", parentId: task.id }],
    ] as const) {
      const result = await api.call(method, path, body, other.token);
      expect([result.status, result.code]).toEqual([404, "TASK_NOT_FOUND"]);
    }
    for (const body of [
      { title: "X", projectId: other.project.id },
      { title: "X", workspaceId: other.work.id },
      { title: "X", tagIds: [otherTag.id] },
    ]) {
      expect((await api.call("POST", "/tasks", body, owner.token)).status).toBe(404);
    }
  });

  it("refuses what makes no sense", async () => {
    const { token, work, project } = await setUp();
    for (const body of [
      {},
      { title: "" },
      { title: "X", status: "finished" },
      { title: "X", priority: "urgent" },
      { title: "X", dueTime: "09:00" },
      { title: "X", dueDate: today, dueTime: "25:00" },
      { title: "X", projectId: project.id, workspaceId: work.id },
      { title: "X", tagIds: "urgent" },
      { title: "X", completedAt: today },
    ]) {
      expect((await api.call("POST", "/tasks", body, token)).status).toBe(400);
    }
    expect((await api.call("GET", "/tasks?due=soon", undefined, token)).status).toBe(400);
  });
});
