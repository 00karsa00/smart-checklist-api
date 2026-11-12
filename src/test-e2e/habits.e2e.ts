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

describe("habits", () => {
  it("adds a daily habit; ticking days builds a streak", async () => {
    const { send, personal } = await setUp();
    const habit = await send("POST", "/habits", {
      title: " Meditate ",
      schedule: { kind: "daily" },
      startDate: addDays(today, -10),
    });
    expect(habit).toMatchObject({
      title: "Meditate",
      workspaceId: personal.id,
      schedule: { kind: "daily" },
      currentStreak: 0,
      doneToday: false,
      dueToday: true,
    });
    for (const offset of [2, 1])
      await send("PUT", `/habits/${habit.id}/days/${addDays(today, -offset)}`);
    // Today not ticked yet: the streak still stands.
    expect((await send("GET", `/habits/${habit.id}`)).currentStreak).toBe(2);
    const ticked = await send("PUT", `/habits/${habit.id}/days/${today}`);
    expect(ticked).toMatchObject({ currentStreak: 3, bestStreak: 3, doneToday: true });
    // Ticking again changes nothing; unticking takes it back.
    expect((await send("PUT", `/habits/${habit.id}/days/${today}`)).currentStreak).toBe(3);
    const unticked = await send("DELETE", `/habits/${habit.id}/days/${addDays(today, -1)}`);
    expect(unticked).toMatchObject({ currentStreak: 1, bestStreak: 1 });
    expect(unticked.lastDays.map((day: any) => day.done)).toEqual([
      false,
      false,
      false,
      false,
      true,
      false,
      true,
    ]);
  });

  it("weekday and weekly habits, edits and archiving", async () => {
    const { send, work } = await setUp();
    const gym = await send("POST", "/habits", {
      title: "Gym",
      workspaceId: work.id,
      schedule: { kind: "weekdays", weekdays: [5, 1, 3, 1] },
    });
    expect(gym.schedule).toEqual({ kind: "weekdays", weekdays: [1, 3, 5] });
    const read = await send("POST", "/habits", {
      title: "Read",
      schedule: { kind: "weekly", timesPerWeek: 2 },
    });
    expect((await send("PUT", `/habits/${read.id}/days/${today}`)).doneThisWeek).toBe(1);

    const edited = await send("PATCH", `/habits/${gym.id}`, {
      schedule: { kind: "daily" },
      reminderTime: "07:30",
      color: "#16a34a",
    });
    expect(edited).toMatchObject({
      schedule: { kind: "daily" },
      reminderTime: "07:30",
      color: "#16A34A",
    });

    await send("PATCH", `/habits/${gym.id}`, { isArchived: true });
    expect((await send("GET", "/habits")).map((habit: any) => habit.title)).toEqual(["Read"]);
    expect(await send("GET", "/habits?includeArchived=true")).toHaveLength(2);
  });

  it("reminds when the time has come and it is not done; finds by search", async () => {
    const { send } = await setUp();
    await send("POST", "/habits", {
      title: "Stretch",
      schedule: { kind: "daily" },
      reminderTime: "00:00",
    });
    const done = await send("POST", "/habits", {
      title: "Vitamins",
      schedule: { kind: "daily" },
      reminderTime: "00:00",
    });
    await send("PUT", `/habits/${done.id}/days/${today}`);
    const notes = await send("GET", "/notifications");
    expect(notes.items.map((item: any) => `${item.kind}:${item.title}`)).toEqual([
      "habit_reminder:Stretch",
    ]);
    const settings = await send("GET", "/notifications/settings");
    expect(settings.groups).toContain("habits");

    const found = await send("GET", "/search?q=stretch");
    expect(found.groups[0]).toMatchObject({ kind: "habit", hits: [{ title: "Stretch" }] });
  });

  it("keeps a workspace with habits, and each user's habits to themselves", async () => {
    const owner = await setUp();
    const other = await setUp();
    const habit = await owner.send("POST", "/habits", {
      title: "Private",
      workspaceId: owner.work.id,
      schedule: { kind: "daily" },
    });
    const busy = await api.call("DELETE", `/workspaces/${owner.work.id}`, undefined, owner.token);
    expect([busy.status, busy.code]).toEqual([409, "WORKSPACE_NOT_EMPTY"]);
    for (const [method, path, body] of [
      ["GET", `/habits/${habit.id}`, undefined],
      ["PATCH", `/habits/${habit.id}`, { title: "Mine" }],
      ["DELETE", `/habits/${habit.id}`, undefined],
      ["PUT", `/habits/${habit.id}/days/${today}`, undefined],
    ] as const) {
      const result = await api.call(method, path, body, other.token);
      expect([result.status, result.code]).toEqual([404, "HABIT_NOT_FOUND"]);
    }
  });

  it("refuses what makes no sense", async () => {
    const { token, send } = await setUp();
    for (const body of [
      { title: "X" },
      { title: "X", schedule: { kind: "hourly" } },
      { title: "X", schedule: { kind: "weekdays", weekdays: [] } },
      { title: "X", schedule: { kind: "weekdays", weekdays: [7] } },
      { title: "X", schedule: { kind: "weekly", timesPerWeek: 8 } },
      { title: "X", schedule: { kind: "daily", extra: 1 } },
      { title: "X", schedule: { kind: "daily" }, reminderTime: "7am" },
      { title: "", schedule: { kind: "daily" } },
    ]) {
      expect((await api.call("POST", "/habits", body, token)).status).toBe(400);
    }
    const habit = await send("POST", "/habits", { title: "Y", schedule: { kind: "daily" } });
    for (const date of [addDays(today, 1), addDays(today, -400), "yesterday"]) {
      expect(
        (await api.call("PUT", `/habits/${habit.id}/days/${date}`, undefined, token)).status,
      ).toBe(400);
    }
  });
});
