import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { addDays } from "../common";
import { Api, startApi, todayIn } from "./support";

let api: Api;
beforeAll(async () => {
  api = await startApi();
});
afterAll(() => api.close());

const today = todayIn("Asia/Kolkata");
const titles = (list: any[]) => list.map((item) => item.title);

describe("dashboard", () => {
  it("is empty but complete for a new user", async () => {
    const { token } = await api.user();
    const board = await api.send("GET", "/dashboard", undefined, token);
    expect(board).toMatchObject({
      today,
      counts: {
        overdue: 0,
        dueToday: 0,
        upcoming: 0,
        noDate: 0,
        completedToday: 0,
        completedThisWeek: 0,
      },
      overdue: [],
      dueToday: [],
      upcoming: [],
      projects: [],
    });
    expect(board.completedByDay).toHaveLength(7);
    expect(board.completedByDay.at(-1)).toEqual({ date: today, count: 0 });
    expect(board.completedByDay[0].date).toBe(addDays(today, -6));
  });

  it("puts each task where it belongs, counts them, and shows project progress", async () => {
    const { token } = await api.user();
    const send = (method: string, path: string, body?: unknown) =>
      api.send(method, path, body, token);
    const [, work] = await send("GET", "/workspaces");
    const launch = await send("POST", "/projects", {
      workspaceId: work.id,
      name: "Launch",
      dueDate: addDays(today, 3),
    });
    await send("POST", "/projects", { workspaceId: work.id, name: "Paused", status: "on_hold" });
    const add = (body: object) => send("POST", "/tasks", body);
    await add({ title: "Late", dueDate: addDays(today, -2), projectId: launch.id });
    await add({ title: "Now", dueDate: today, priority: "high" });
    await add({ title: "Soon", dueDate: addDays(today, 2), projectId: launch.id });
    await add({ title: "Far", dueDate: addDays(today, 30) });
    await add({ title: "Someday" });
    await add({ title: "Shipped", status: "done", projectId: launch.id });

    const board = await send("GET", "/dashboard");
    expect(titles(board.overdue)).toEqual(["Late"]);
    expect(titles(board.dueToday)).toEqual(["Now"]);
    expect(titles(board.upcoming)).toEqual(["Soon"]);
    expect(board.counts).toEqual({
      overdue: 1,
      dueToday: 1,
      upcoming: 1,
      noDate: 1,
      completedToday: 1,
      completedThisWeek: 1,
    });
    expect(board.completedByDay.at(-1)).toEqual({ date: today, count: 1 });
    // Only active projects, with their top-level tasks done and in all.
    expect(board.projects).toHaveLength(1);
    expect(board.projects[0]).toMatchObject({ name: "Launch", progress: { done: 1, total: 3 } });
  });

  it("is for users only", async () => {
    expect((await api.call("GET", "/dashboard")).status).toBe(401);
  });
});
