import { addDays, weekdayOf } from "../../common";

import { candidate } from "../notification/notification.sources";
import { Habit, HabitDay, HabitSchedule, HabitStats } from "./types/habit.type";

const CONSISTENCY_DAYS = 30;
/** Never look further back than this for streaks. */
const HISTORY_DAYS = 2 * 366;

/** Whether the habit is due on `date` (weekly habits: any day counts toward the week). */
export function isDue(schedule: HabitSchedule, date: string): boolean {
  return schedule.kind !== "weekdays" || schedule.weekdays.includes(weekdayOf(date));
}

/** The first day of the week `date` is in. */
const weekStart = (date: string, weekStartsOn: number) =>
  addDays(date, -((weekdayOf(date) - weekStartsOn + 7) % 7));

/** Days with a tick in [from, to] of the week starting on `start`. */
const ticksInWeek = (done: ReadonlySet<string>, start: string, upTo: string) => {
  let count = 0;
  for (let day = 0; day < 7; day++) {
    const date = addDays(start, day);
    if (date <= upTo && done.has(date)) count++;
  }
  return count;
};

/**
 * Streaks, consistency and the last week of a habit, from the days it was
 * ticked. Daily and weekday habits count days; weekly habits count weeks that
 * reached their number. Today (and this week) only count once done: not done
 * yet is not a break.
 */
export function habitStats(
  schedule: HabitSchedule,
  checks: readonly string[],
  startDate: string,
  today: string,
  weekStartsOn: number,
): HabitStats {
  const done = new Set(checks);
  const lastDays: HabitDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    return { date, done: done.has(date), due: date >= startDate && isDue(schedule, date) };
  });
  const thisWeek = weekStart(today, weekStartsOn);
  const doneThisWeek = ticksInWeek(done, thisWeek, today);
  const base = {
    doneToday: done.has(today),
    dueToday: isDue(schedule, today),
    doneThisWeek,
    lastDays,
  };
  const earliest = [startDate, addDays(today, -HISTORY_DAYS)].sort().at(-1)!;

  if (schedule.kind === "weekly") {
    const met = (start: string) => ticksInWeek(done, start, today) >= schedule.timesPerWeek;
    // Weeks from the oldest to this one; this week only counts once met.
    const weeks: string[] = [];
    for (
      let start = thisWeek;
      start >= weekStart(earliest, weekStartsOn);
      start = addDays(start, -7)
    ) {
      weeks.unshift(start);
    }
    const counted = met(thisWeek) ? weeks : weeks.slice(0, -1);
    const { current, best } = runs(counted.map(met));
    const recent = counted.filter((start) => start >= addDays(today, -CONSISTENCY_DAYS + 1));
    return {
      ...base,
      currentStreak: current,
      bestStreak: best,
      consistency: percent(recent.filter(met).length, recent.length),
    };
  }

  // Due days from the oldest to today; today only counts once done.
  const days: string[] = [];
  for (let date = earliest; date <= today; date = addDays(date, 1)) {
    if (isDue(schedule, date) && (date < today || done.has(date))) days.push(date);
  }
  const { current, best } = runs(days.map((date) => done.has(date)));
  const recent = days.filter((date) => date >= addDays(today, -CONSISTENCY_DAYS + 1));
  return {
    ...base,
    currentStreak: current,
    bestStreak: best,
    consistency: percent(recent.filter((date) => done.has(date)).length, recent.length),
  };
}

/** The run of trues at the end, and the longest run. */
function runs(values: readonly boolean[]): { current: number; best: number } {
  let run = 0;
  let best = 0;
  for (const value of values) {
    run = value ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { current: run, best };
}

const percent = (part: number, whole: number) =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

/** Habits with a reminder time that has come today, due today and not done yet. */
export const habitReminders = (habits: readonly Habit[], now: { date: string; time: string }) =>
  habits
    .filter(
      (habit) =>
        !habit.isArchived &&
        habit.reminderTime !== null &&
        habit.reminderTime <= now.time &&
        habit.startDate <= now.date &&
        habit.dueToday &&
        !habit.doneToday,
    )
    .map((habit) =>
      candidate(
        "habit_reminder",
        { subjectType: "habit", subjectId: habit.id, title: habit.title },
        { reminderTime: habit.reminderTime, streak: habit.currentStreak },
        now.date,
      ),
    );
