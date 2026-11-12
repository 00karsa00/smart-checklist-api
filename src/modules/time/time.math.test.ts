import { describe, expect, it } from "vitest";

import { focusDone, localDay, secondsBetween, timesheet, weekDays } from "./time.math";
import { TimeEntry } from "./types/time.type";

describe("secondsBetween", () => {
  it("counts whole seconds, up to now while running", () => {
    const start = new Date("2026-11-12T09:00:00Z");
    expect(secondsBetween(start, new Date("2026-11-12T09:30:30.900Z"))).toBe(1830);
    expect(secondsBetween(start, null, new Date("2026-11-12T10:00:00Z"))).toBe(3600);
    expect(secondsBetween(start, new Date("2026-11-12T08:00:00Z"))).toBe(0);
  });
});

describe("localDay and weekDays", () => {
  it("uses the user's time zone and first day of the week", () => {
    expect(localDay(new Date("2026-11-12T20:00:00Z"), "Asia/Kolkata")).toBe("2026-11-13");
    expect(weekDays("2026-11-12", 1)[0]).toBe("2026-11-09");
    expect(weekDays("2026-11-12", 0)).toHaveLength(7);
  });
});

describe("timesheet", () => {
  const days = weekDays("2026-11-12", 1);
  const labels = {
    task: (id: string) => ({ t1: "Write copy" })[id],
    project: (id: string) => ({ p1: "Launch" })[id],
  };
  const entry = (
    date: string,
    seconds: number,
    taskId: string | null = null,
    projectId: string | null = null,
  ) => ({
    taskId,
    projectId,
    description: "Typed",
    date,
    seconds,
  });

  it("sums by task, project or neither, per day, most time first", () => {
    const sheet = timesheet(
      [
        entry("2026-11-09", 3600, "t1", "p1"),
        entry("2026-11-10", 1800, "t1", "p1"),
        entry("2026-11-10", 600, null, "p1"),
        entry("2026-11-12", 900),
        entry("2026-11-20", 9999, "t1"),
      ],
      days,
      labels,
    );
    expect(sheet.rows.map((row) => [row.label, row.total])).toEqual([
      ["Write copy", 5400],
      ["No task", 900],
      ["Launch", 600],
    ]);
    expect(sheet.rows[0].perDay).toEqual([3600, 1800, 0, 0, 0, 0, 0]);
    expect(sheet.dayTotals).toEqual([3600, 2400, 0, 900, 0, 0, 0]);
    expect(sheet.total).toBe(6900);
  });

  it("names a deleted task by what was typed", () => {
    const sheet = timesheet([entry("2026-11-09", 60, "gone")], days, labels);
    expect(sheet.rows[0].label).toBe("Typed");
  });
});

describe("focusDone", () => {
  const session = (parts: Partial<TimeEntry>) =>
    ({
      id: "e",
      kind: "focus",
      plannedMinutes: 25,
      seconds: 25 * 60,
      description: "Write copy",
      ...parts,
    }) as TimeEntry;

  it("says so once a focus session reaches its planned length", () => {
    expect(focusDone(session({}))).toMatchObject([
      { kind: "focus_done", subjectId: "e", title: "Write copy", dedupeKey: "focus_done:e" },
    ]);
    expect(focusDone(session({ seconds: 25 * 60 - 1 }))).toEqual([]);
    expect(focusDone(session({ kind: "work", plannedMinutes: null }))).toEqual([]);
    expect(focusDone(null)).toEqual([]);
  });
});
