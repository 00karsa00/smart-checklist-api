export const TIME_KINDS = ["work", "focus"] as const;
export type TimeKind = (typeof TIME_KINDS)[number];

export type TimeEntry = {
  id: string;
  taskId: string | null;
  projectId: string | null;
  description: string;
  kind: TimeKind;
  /** Focus sessions: how long it was meant to be. */
  plannedMinutes: number | null;
  startedAt: Date;
  /** null while the timer runs. */
  endedAt: Date | null;
  running: boolean;
  /** Seconds so far (up to now while running). */
  seconds: number;
  /** The user's local day it started on (YYYY-MM-DD). */
  date: string;
};

/** GET /time/entries: entries newest first, and their total. */
export type TimeEntryList = { items: TimeEntry[]; totalSeconds: number };

/** One line of a timesheet: a task, a project without a task, or neither. */
export type TimesheetRow = {
  key: string;
  taskId: string | null;
  projectId: string | null;
  label: string;
  /** Seconds on each day of the week, in order. */
  perDay: number[];
  total: number;
};

/** GET /time/timesheet: a week of time, by task. */
export type Timesheet = {
  /** The week's 7 days, from the user's first day of the week. */
  days: string[];
  rows: TimesheetRow[];
  dayTotals: number[];
  total: number;
};
