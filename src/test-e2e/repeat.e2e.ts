import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { addDays } from "../common";
import { Api, startApi, todayIn } from "./support";

let api: Api;
beforeAll(async () => {
  api = await startApi();
});
afterAll(() => api.close());

const today = todayIn("Asia/Kolkata");

describe("repeating tasks", () => {
  it("completing one adds the next copy with the same details, once", async () => {
    const { token } = await api.user();
    const send = (method: string, path: string, body?: unknown) =>
      api.send(method, path, body, token);
    const tag = await send("POST", "/tags", { name: "home" });
    const task = await send("POST", "/tasks", {
      title: "Water plants",
      priority: "medium",
      dueDate: today,
      dueTime: "08:00",
      remindAt: `${today}T07:30`,
      tagIds: [tag.id],
      repeat: { frequency: "daily", interval: 2 },
    });
    expect(task.repeat).toEqual({ frequency: "daily", interval: 2 });
    await send("POST", "/tasks", { title: "Fill can", parentId: task.id, status: "done" });

    const done = await send("PATCH", `/tasks/${task.id}`, { status: "done" });
    expect(done.nextId).not.toBeNull();
    const next = await send("GET", `/tasks/${done.nextId}`);
    expect(next).toMatchObject({
      title: "Water plants",
      status: "todo",
      priority: "medium",
      dueDate: addDays(today, 2),
      dueTime: "08:00",
      remindAt: `${addDays(today, 2)}T07:30`,
      tagIds: [tag.id],
      repeat: { frequency: "daily", interval: 2 },
      nextId: null,
    });
    // Its subtasks come again, not done.
    expect(next.children.map((child: any) => [child.title, child.status])).toEqual([
      ["Fill can", "todo"],
    ]);

    // Reopened and done again: no second copy.
    await send("PATCH", `/tasks/${task.id}`, { status: "todo" });
    await send("PATCH", `/tasks/${task.id}`, { status: "done" });
    const open = await send("GET", "/tasks?q=Water");
    expect(open.items.map((item: any) => item.dueDate)).toEqual([addDays(today, 2)]);
  });

  it("finished late, the next one is due today, not in the past", async () => {
    const { token } = await api.user();
    const task = await api.send(
      "POST",
      "/tasks",
      { title: "Weekly review", dueDate: addDays(today, -15), repeat: { frequency: "weekly" } },
      token,
    );
    const done = await api.send("PATCH", `/tasks/${task.id}`, { status: "done" }, token);
    const next = await api.send("GET", `/tasks/${done.nextId}`, undefined, token);
    expect(next.dueDate >= today).toBe(true);
    expect(next.dueDate <= addDays(today, 6)).toBe(true);
  });

  it("monthly keeps its day; weekdays are sorted; stopping a repeat adds nothing", async () => {
    const { token } = await api.user();
    const monthly = await api.send(
      "POST",
      "/tasks",
      { title: "Rent", dueDate: "2026-01-31", repeat: { frequency: "monthly" } },
      token,
    );
    expect(monthly.repeat).toEqual({ frequency: "monthly", interval: 1, anchorDay: 31 });
    const weekly = await api.send(
      "POST",
      "/tasks",
      {
        title: "Gym",
        dueDate: today,
        repeat: { frequency: "weekly", weekdays: [5, 1, 3, 1] },
      },
      token,
    );
    expect(weekly.repeat.weekdays).toEqual([1, 3, 5]);

    await api.send("PATCH", `/tasks/${weekly.id}`, { repeat: null }, token);
    const done = await api.send("PATCH", `/tasks/${weekly.id}`, { status: "done" }, token);
    expect(done.nextId).toBeNull();
  });

  it("refuses rules that make no sense", async () => {
    const { token } = await api.user();
    const parent = await api.send("POST", "/tasks", { title: "Parent" }, token);
    for (const body of [
      { title: "X", repeat: { frequency: "daily" } },
      { title: "X", dueDate: today, repeat: { frequency: "hourly" } },
      { title: "X", dueDate: today, repeat: { frequency: "daily", interval: 0 } },
      { title: "X", dueDate: today, repeat: { frequency: "daily", weekdays: [1] } },
      { title: "X", dueDate: today, repeat: { frequency: "weekly", weekdays: [7] } },
      { title: "X", dueDate: today, repeat: { frequency: "weekly", anchorDay: 3 } },
      { title: "X", dueDate: today, repeat: "daily" },
      { title: "X", dueDate: today, parentId: parent.id, repeat: { frequency: "daily" } },
    ]) {
      expect((await api.call("POST", "/tasks", body, token)).status).toBe(400);
    }
    const task = await api.send(
      "POST",
      "/tasks",
      { title: "Y", dueDate: today, repeat: { frequency: "daily" } },
      token,
    );
    expect((await api.call("PATCH", `/tasks/${task.id}`, { dueDate: null }, token)).status).toBe(
      400,
    );
  });
});
