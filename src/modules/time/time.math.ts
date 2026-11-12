import { addDays, todayIn, weekdayOf } from "../../common";

import { candidate } from "../notification/notification.sources";
import { Timesheet, TimesheetRow, TimeEntry } from "./types/time.type";

/** Whole seconds from `start` to `end` (now while running). */
export const secondsBetween = (start: Date, end: Date | null, now = new Date()) =>
  Math.max(0, Math.floor(((end ?? now).getTime() - start.getTime()) / 1000));

/** The local day (YYYY-MM-DD, in `timeZone`) a moment falls on. */
export const localDay = (moment: Date, timeZone: string) => todayIn(timeZone, moment);

/** The 7 days of the week `date` is in, starting on `weekStartsOn` (0 = Sunday). */
export function weekDays(date: string, weekStartsOn: number): string[] {
  const start = addDays(date, -((weekdayOf(date) - weekStartsOn + 7) % 7));
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/**
 * A week of time by task (or project, or neither), each entry counted whole
 * on the day it started. Rows with the most time first.
 */
export function timesheet(
  entries: readonly Pick<TimeEntry, "taskId" | "projectId" | "description" | "date" | "seconds">[],
  days: readonly string[],
  labels: { task: (id: string) => string | undefined; project: (id: string) => string | undefined },
): Timesheet {
  const rows = new Map<string, TimesheetRow>();
  for (const entry of entries) {
    const index = days.indexOf(entry.date);
    if (index === -1) continue;
    const key = entry.taskId
      ? `task:${entry.taskId}`
      : entry.projectId
        ? `project:${entry.projectId}`
        : "none";
    const label = entry.taskId
      ? (labels.task(entry.taskId) ?? entry.description)
      : entry.projectId
        ? (labels.project(entry.projectId) ?? "Project")
        : "No task";
    const row = rows.get(key) ?? {
      key,
      taskId: entry.taskId,
      projectId: entry.taskId ? null : entry.projectId,
      label,
      perDay: days.map(() => 0),
      total: 0,
    };
    row.perDay[index] += entry.seconds;
    row.total += entry.seconds;
    rows.set(key, row);
  }
  const sorted = [...rows.values()].sort(
    (a, b) => b.total - a.total || a.label.localeCompare(b.label),
  );
  const dayTotals = days.map((_, index) => sorted.reduce((sum, row) => sum + row.perDay[index], 0));
  return { days: [...days], rows: sorted, dayTotals, total: dayTotals.reduce((a, b) => a + b, 0) };
}

/** A running focus session whose planned length is up: once per session. */
export const focusDone = (running: TimeEntry | null) =>
  running?.kind === "focus" &&
  running.plannedMinutes !== null &&
  running.seconds >= running.plannedMinutes * 60
    ? [
        candidate(
          "focus_done",
          { subjectType: "time_entry", subjectId: running.id, title: running.description },
          { plannedMinutes: running.plannedMinutes },
        ),
      ]
    : [];
