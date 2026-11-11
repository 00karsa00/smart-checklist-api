import { addDays, addMonths, weekdayOf } from "../../common";

export const REPEAT_FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;
export type RepeatFrequency = (typeof REPEAT_FREQUENCIES)[number];

/** How a task repeats, counted from its due date. */
export type RepeatRule = {
  frequency: RepeatFrequency;
  /** Every N days, weeks, months or years (1 or more). */
  interval: number;
  /** Weekly only: the days it falls on (0 = Sunday … 6 = Saturday), sorted. */
  weekdays?: number[];
  /** Monthly and yearly: the day of the month it keeps to (set from the due date). */
  anchorDay?: number;
};

/** The next date after `from` that the rule falls on. */
export function nextOccurrence(rule: RepeatRule, from: string): string {
  const { frequency, interval } = rule;
  switch (frequency) {
    case "daily":
      return addDays(from, interval);
    case "weekly": {
      const days = rule.weekdays?.length ? rule.weekdays : [weekdayOf(from)];
      const today = weekdayOf(from);
      // Later the same week, or the first chosen day `interval` weeks on.
      const later = days.find((day) => day > today);
      return later !== undefined
        ? addDays(from, later - today)
        : addDays(from, 7 * interval - today + days[0]);
    }
    case "monthly":
      return addMonths(from, interval, rule.anchorDay);
    case "yearly":
      return addMonths(from, 12 * interval, rule.anchorDay);
  }
}

/**
 * When the next copy of a task completed on `today` is due: the next date
 * after its due date, moved on until it is today or later, so finishing late
 * does not leave a pile of overdue copies.
 */
export function nextDueDate(rule: RepeatRule, due: string, today: string): string {
  let next = nextOccurrence(rule, due);
  while (next < today) next = nextOccurrence(rule, next);
  return next;
}
