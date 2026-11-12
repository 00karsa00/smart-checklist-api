import { describe, expect, it } from "vitest";

import { addDays } from "../../common";
import { habitReminders, habitStats, isDue } from "./habit.stats";
import { HabitSchedule } from "./types/habit.type";

// 2026-11-12 is a Thursday; weeks start on Monday (1).
const today = "2026-11-12";
const daysAgo = (...offsets: number[]) => offsets.map((offset) => addDays(today, -offset));
const daily: HabitSchedule = { kind: "daily" };
const stats = (schedule: HabitSchedule, checks: string[], start = addDays(today, -60)) =>
  habitStats(schedule, checks, start, today, 1);

describe("isDue", () => {
  it("follows the schedule", () => {
    expect(isDue(daily, today)).toBe(true);
    expect(isDue({ kind: "weekdays", weekdays: [1, 3, 5] }, today)).toBe(false);
    expect(isDue({ kind: "weekdays", weekdays: [4] }, today)).toBe(true);
    expect(isDue({ kind: "weekly", timesPerWeek: 3 }, today)).toBe(true);
  });
});

describe("daily streaks", () => {
  it("counts days in a row; today not done yet does not break it", () => {
    expect(stats(daily, daysAgo(1, 2, 3)).currentStreak).toBe(3);
    expect(stats(daily, daysAgo(0, 1, 2, 3)).currentStreak).toBe(4);
    expect(stats(daily, daysAgo(0, 2, 3)).currentStreak).toBe(1);
    expect(stats(daily, daysAgo(2, 3)).currentStreak).toBe(0);
  });

  it("remembers the best run", () => {
    const result = stats(daily, daysAgo(0, 10, 11, 12, 13, 14));
    expect([result.currentStreak, result.bestStreak]).toEqual([1, 5]);
  });

  it("does not count days before the habit started", () => {
    const result = stats(daily, daysAgo(0, 1), addDays(today, -1));
    expect(result).toMatchObject({ currentStreak: 2, consistency: 100 });
  });
});

describe("weekday habits", () => {
  it("skips days it is not due on", () => {
    // Mon, Wed, Fri: done Mon 9th and Wed 11th, and Fri 6th before them.
    const monWedFri: HabitSchedule = { kind: "weekdays", weekdays: [1, 3, 5] };
    const result = stats(monWedFri, ["2026-11-09", "2026-11-11", "2026-11-06"]);
    expect(result.currentStreak).toBe(3);
    expect(result.dueToday).toBe(false);
  });
});

describe("weekly habits", () => {
  const thrice: HabitSchedule = { kind: "weekly", timesPerWeek: 3 };

  it("counts weeks that reached their number; this week once reached", () => {
    // Last week (Mon 2nd – Sun 8th): 3 times. Week before: 3 times.
    const earlier = [
      "2026-11-02",
      "2026-11-04",
      "2026-11-06",
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
    ];
    expect(stats(thrice, earlier)).toMatchObject({ currentStreak: 2, doneThisWeek: 0 });
    const thisWeek = [...earlier, "2026-11-09", "2026-11-10", "2026-11-12"];
    expect(stats(thrice, thisWeek)).toMatchObject({ currentStreak: 3, doneThisWeek: 3 });
  });
});

describe("consistency and the last days", () => {
  it("is the share of due days done in the last 30 days", () => {
    const everyOther = Array.from({ length: 15 }, (_, index) => addDays(today, -2 * index - 1));
    // 29 past days due (today not done, so not counted), 15 done.
    expect(stats(daily, everyOther).consistency).toBe(52);
  });

  it("gives the last 7 days, oldest first", () => {
    const { lastDays } = stats(daily, daysAgo(0, 6), addDays(today, -3));
    expect(lastDays).toHaveLength(7);
    expect(lastDays[0]).toEqual({ date: addDays(today, -6), done: true, due: false });
    expect(lastDays[6]).toEqual({ date: today, done: true, due: true });
  });
});

describe("habitReminders", () => {
  it("reminds once its time has come, when due and not done", () => {
    const habit = (parts: object) =>
      ({
        id: "h",
        title: "Meditate",
        isArchived: false,
        reminderTime: "08:00",
        startDate: "2026-11-01",
        dueToday: true,
        doneToday: false,
        currentStreak: 4,
        ...parts,
      }) as never;
    const now = { date: today, time: "09:00" };
    expect(habitReminders([habit({})], now)).toMatchObject([
      { kind: "habit_reminder", dedupeKey: `habit_reminder:h:${today}`, data: { streak: 4 } },
    ]);
    for (const parts of [
      { reminderTime: "10:00" },
      { doneToday: true },
      { dueToday: false },
      { reminderTime: null },
      { isArchived: true },
    ]) {
      expect(habitReminders([habit(parts)], now)).toEqual([]);
    }
  });
});
