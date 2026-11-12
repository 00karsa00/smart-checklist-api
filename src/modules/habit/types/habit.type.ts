export const HABIT_SCHEDULES = ["daily", "weekdays", "weekly"] as const;
export type HabitScheduleKind = (typeof HABIT_SCHEDULES)[number];

/** When a habit is due: every day, on some weekdays, or N times in each week. */
export type HabitSchedule =
  | { kind: "daily" }
  /** 0 = Sunday … 6 = Saturday, sorted. */
  | { kind: "weekdays"; weekdays: number[] }
  | { kind: "weekly"; timesPerWeek: number };

/** One day of the recent past, for a week strip. */
export type HabitDay = { date: string; done: boolean; due: boolean };

export type HabitStats = {
  /** Days (daily, weekdays) or weeks (weekly) in a row, up to today; today not done yet does not break it. */
  currentStreak: number;
  bestStreak: number;
  /** 0–100: how many due days (or weeks) of the last 30 days were done. */
  consistency: number;
  doneToday: boolean;
  dueToday: boolean;
  /** Weekly habits: ticks this week so far. */
  doneThisWeek: number;
  /** The last 7 days, oldest first. */
  lastDays: HabitDay[];
};

export type Habit = {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  schedule: HabitSchedule;
  /** HH:MM: a reminder that day when not done yet, or null. */
  reminderTime: string | null;
  /** The first day it counts from (YYYY-MM-DD). */
  startDate: string;
  isArchived: boolean;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
} & HabitStats;
