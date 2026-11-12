import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { addDays } from "../common";
import { Api, startApi, todayIn } from "./support";

let api: Api;
beforeAll(async () => {
  api = await startApi();
});
afterAll(() => api.close());

const today = todayIn("Asia/Kolkata");
// One moment for every time in this file, so spans come out whole.
const NOW = Date.now() - 60_000;
// Lists start yesterday: entries from hours ago may fall there just after midnight.
const sinceYesterday = `from=${addDays(today, -1)}&to=${today}`;
const hoursAgo = (hours: number) => new Date(NOW - hours * 3_600_000).toISOString();

async function setUp() {
  const { token } = await api.user();
  const send = (method: string, path: string, body?: unknown) =>
    api.send(method, path, body, token);
  const [, work] = await send("GET", "/workspaces");
  const project = await send("POST", "/projects", { workspaceId: work.id, name: "Launch" });
  const task = await send("POST", "/tasks", { title: "Write copy", projectId: project.id });
  return { token, send, project, task };
}

describe("time tracking", () => {
  it("runs one timer at a time; starting another stops the first", async () => {
    const { token, send, task } = await setUp();
    expect(await send("GET", "/time/running")).toBeNull();
    const first = await send("POST", "/time/start", { taskId: task.id });
    expect(first).toMatchObject({
      description: "Write copy",
      taskId: task.id,
      projectId: task.projectId,
      kind: "work",
      running: true,
      date: today,
    });
    const second = await send("POST", "/time/start", { description: "Emails" });
    expect((await send("GET", "/time/running")).id).toBe(second.id);
    const stopped = await send("POST", "/time/stop");
    expect(stopped).toMatchObject({ id: second.id, running: false });
    expect(await send("GET", "/time/running")).toBeNull();
    const again = await api.call("POST", "/time/stop", undefined, token);
    expect([again.status, again.code]).toEqual([409, "NO_TIMER_RUNNING"]);

    const list = await send("GET", `/time/entries?from=${today}&to=${today}`);
    expect(list.items.map((item: any) => item.id)).toEqual([second.id, first.id]);
    expect(list.items.every((item: any) => !item.running)).toBe(true);
  });

  it("logs time by hand, edits and deletes it; adds it up in a timesheet", async () => {
    const { send, task } = await setUp();
    const logged = await send("POST", "/time/entries", {
      taskId: task.id,
      startedAt: hoursAgo(3),
      endedAt: hoursAgo(1),
    });
    expect(logged).toMatchObject({ seconds: 7200, running: false, description: "Write copy" });
    await send("POST", "/time/entries", {
      description: "Planning",
      startedAt: hoursAgo(5),
      endedAt: hoursAgo(4.5),
    });
    const edited = await send("PATCH", `/time/entries/${logged.id}`, { startedAt: hoursAgo(2) });
    expect(edited.seconds).toBe(3600);

    const sheet = await send("GET", "/time/timesheet");
    expect(sheet.days).toHaveLength(7);
    expect(sheet.days).toContain(today);
    expect(sheet.rows.map((row: any) => [row.label, row.total])).toEqual(
      expect.arrayContaining([
        ["Write copy", 3600],
        ["No task", 1800],
      ]),
    );
    expect(sheet.total).toBe(5400);

    await send("DELETE", `/time/entries/${logged.id}`);
    expect((await send("GET", `/time/entries?${sinceYesterday}`)).totalSeconds).toBe(1800);
  });

  it("keeps time when its task is deleted", async () => {
    const { send, task } = await setUp();
    const entry = await send("POST", "/time/entries", {
      taskId: task.id,
      startedAt: hoursAgo(2),
      endedAt: hoursAgo(1),
    });
    await send("DELETE", `/tasks/${task.id}`);
    const sheet = await send("GET", "/time/timesheet");
    expect(sheet.rows).toEqual([expect.objectContaining({ taskId: null, label: "Launch" })]);
    expect((await send("GET", `/time/entries?${sinceYesterday}`)).items[0]).toMatchObject({
      id: entry.id,
      description: "Write copy",
      taskId: null,
    });
  });

  it("says when a focus session is up", async () => {
    const { send } = await setUp();
    const focus = await send("POST", "/time/start", {
      description: "Deep work",
      kind: "focus",
      plannedMinutes: 1,
    });
    await send("PATCH", `/time/entries/${focus.id}`, { startedAt: hoursAgo(0.5) });
    const notes = await send("GET", "/notifications");
    expect(notes.items.map((item: any) => `${item.kind}:${item.title}`)).toEqual([
      "focus_done:Deep work",
    ]);
  });

  it("keeps each user's time to themselves, and refuses what makes no sense", async () => {
    const owner = await setUp();
    const other = await setUp();
    const entry = await owner.send("POST", "/time/entries", {
      description: "Mine",
      startedAt: hoursAgo(2),
      endedAt: hoursAgo(1),
    });
    for (const [method, path, body] of [
      ["PATCH", `/time/entries/${entry.id}`, { description: "x" }],
      ["DELETE", `/time/entries/${entry.id}`, undefined],
    ] as const) {
      const result = await api.call(method, path, body, other.token);
      expect([result.status, result.code]).toEqual([404, "TIME_ENTRY_NOT_FOUND"]);
    }
    expect(
      (await api.call("POST", "/time/start", { taskId: owner.task.id }, other.token)).status,
    ).toBe(404);

    for (const body of [
      {},
      { kind: "focus", description: "x" },
      { description: "x", plannedMinutes: 0 },
      { description: "x", kind: "nap" },
    ]) {
      expect((await api.call("POST", "/time/start", body, other.token)).status).toBe(400);
    }
    for (const body of [
      { description: "x", startedAt: hoursAgo(1), endedAt: hoursAgo(2) },
      {
        description: "x",
        startedAt: hoursAgo(1),
        endedAt: new Date(Date.now() + 3_600_000).toISOString(),
      },
      { description: "x", startedAt: hoursAgo(30), endedAt: hoursAgo(1) },
      { description: "x", startedAt: "yesterday", endedAt: hoursAgo(1) },
    ]) {
      expect((await api.call("POST", "/time/entries", body, other.token)).status).toBe(400);
    }
    for (const query of [
      `from=${today}`,
      `from=${today}&to=${addDays(today, -1)}`,
      `from=${addDays(today, -90)}&to=${today}`,
    ]) {
      expect((await api.call("GET", `/time/entries?${query}`, undefined, other.token)).status).toBe(
        400,
      );
    }
  });
});
