import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { addDays } from "../common";
import { Api, startApi, todayIn } from "./support";

let api: Api;
beforeAll(async () => {
  api = await startApi();
});
afterAll(() => api.close());

const today = todayIn("Asia/Kolkata");

async function setUp() {
  const { token } = await api.user();
  const send = (method: string, path: string, body?: unknown) =>
    api.send(method, path, body, token);
  const [personal, work] = await send("GET", "/workspaces");
  return { token, send, personal, work };
}

describe("goals", () => {
  it("adds a goal with milestones in the first workspace; ticking them moves progress", async () => {
    const { send, personal } = await setUp();
    const goal = await send("POST", "/goals", {
      title: " Run a half marathon ",
      targetDate: addDays(today, 90),
      milestones: ["Run 5 km", "Run 10 km", "Run 21 km"],
    });
    expect(goal).toMatchObject({
      title: "Run a half marathon",
      status: "active",
      workspaceId: personal.id,
      milestones: { done: 0, total: 3 },
      progress: 0,
      overdue: false,
      nextMilestone: { title: "Run 5 km" },
    });
    const [first] = goal.milestoneList;
    const ticked = await send("PATCH", `/goals/${goal.id}/milestones/${first.id}`, { done: true });
    expect(ticked).toMatchObject({ progress: 33, nextMilestone: { title: "Run 10 km" } });
    expect(ticked.milestoneList[0].doneAt).not.toBeNull();

    const added = await send("POST", `/goals/${goal.id}/milestones`, {
      title: "Race day",
      dueDate: addDays(today, 90),
    });
    expect(added.milestoneList.map((step: any) => step.position)).toEqual([0, 1, 2, 3]);
    const removed = await send("DELETE", `/goals/${goal.id}/milestones/${first.id}`);
    expect(removed.milestones).toEqual({ done: 0, total: 3 });
  });

  it("counts the tasks of linked projects in its progress", async () => {
    const { send, work } = await setUp();
    const project = await send("POST", "/projects", { workspaceId: work.id, name: "Training" });
    await send("POST", "/tasks", { title: "Buy shoes", projectId: project.id, status: "done" });
    await send("POST", "/tasks", { title: "Plan route", projectId: project.id });
    const goal = await send("POST", "/goals", {
      title: "Fitness",
      milestones: ["Start"],
      projectIds: [project.id, project.id],
    });
    expect(goal).toMatchObject({
      projectIds: [project.id],
      tasks: { done: 1, total: 2 },
      progress: 33,
    });
    // Unlinked: only the milestone counts.
    expect(await send("PATCH", `/goals/${goal.id}`, { projectIds: [] })).toMatchObject({
      projectIds: [],
      tasks: { done: 0, total: 0 },
      progress: 0,
    });
    // A deleted project drops out of the goal.
    await send("PATCH", `/goals/${goal.id}`, { projectIds: [project.id] });
    await send("DELETE", `/projects/${project.id}`);
    expect((await send("GET", `/goals/${goal.id}`)).projectIds).toEqual([]);
  });

  it("is achieved at 100, can be dropped, lists by status and target date", async () => {
    const { send } = await setUp();
    const late = await send("POST", "/goals", {
      title: "Learn Spanish",
      targetDate: addDays(today, -1),
    });
    expect(late.overdue).toBe(true);
    const soon = await send("POST", "/goals", {
      title: "Read 12 books",
      targetDate: addDays(today, 30),
    });
    await send("POST", "/goals", { title: "Someday" });

    const achieved = await send("PATCH", `/goals/${soon.id}`, { status: "achieved" });
    expect(achieved).toMatchObject({ status: "achieved", progress: 100 });
    expect(achieved.achievedAt).not.toBeNull();
    expect((await send("PATCH", `/goals/${soon.id}`, { status: "active" })).achievedAt).toBeNull();
    await send("PATCH", `/goals/${late.id}`, { status: "dropped" });

    const titles = (list: any[]) => list.map((goal) => goal.title);
    expect(titles(await send("GET", "/goals"))).toEqual([
      "Learn Spanish",
      "Read 12 books",
      "Someday",
    ]);
    expect(titles(await send("GET", "/goals?status=active"))).toEqual(["Read 12 books", "Someday"]);
    expect(titles((await send("GET", "/search?q=spanish")).groups[0].hits)).toEqual([
      "Learn Spanish",
    ]);
  });

  it("keeps a workspace with goals, and each user's goals to themselves", async () => {
    const owner = await setUp();
    const other = await setUp();
    const goal = await owner.send("POST", "/goals", {
      title: "Private",
      workspaceId: owner.work.id,
      milestones: ["Step"],
    });
    const busy = await api.call("DELETE", `/workspaces/${owner.work.id}`, undefined, owner.token);
    expect([busy.status, busy.code]).toEqual([409, "WORKSPACE_NOT_EMPTY"]);
    for (const [method, path, body] of [
      ["GET", `/goals/${goal.id}`, undefined],
      ["PATCH", `/goals/${goal.id}`, { title: "Mine" }],
      ["DELETE", `/goals/${goal.id}`, undefined],
      ["POST", `/goals/${goal.id}/milestones`, { title: "x" }],
      ["PATCH", `/goals/${goal.id}/milestones/${goal.milestoneList[0].id}`, { done: true }],
    ] as const) {
      const result = await api.call(method, path, body, other.token);
      expect([result.status, result.code]).toEqual([404, "GOAL_NOT_FOUND"]);
    }
    const project = await owner.send("POST", "/projects", {
      workspaceId: owner.work.id,
      name: "P",
    });
    expect(
      (await api.call("POST", "/goals", { title: "X", projectIds: [project.id] }, other.token))
        .status,
    ).toBe(404);
  });

  it("refuses what makes no sense", async () => {
    const { token } = await setUp();
    for (const body of [
      {},
      { title: "" },
      { title: "X", targetDate: "next year" },
      { title: "X", milestones: [""] },
      { title: "X", projectIds: ["nope"] },
      { title: "X", status: "achieved" },
    ]) {
      expect((await api.call("POST", "/goals", body, token)).status).toBe(400);
    }
    expect((await api.call("GET", "/goals?status=done", undefined, token)).status).toBe(400);
  });
});
