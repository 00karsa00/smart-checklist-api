// Calendar dates as "YYYY-MM-DD" strings (no time, no time zone), as the
// `date` columns store them. Arithmetic runs in UTC so daylight
// saving never shifts a day.

const toDate = (date: string) => new Date(`${date}T00:00:00Z`);
const toText = (date: Date) => date.toISOString().slice(0, 10);

/** Today's date in a time zone, e.g. todayIn("Asia/Kolkata"). */
export function todayIn(timeZone: string, now = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

/** The time of day in a time zone as HH:MM (24-hour), e.g. timeIn("Asia/Kolkata"). */
export function timeIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

export function addDays(date: string, days: number): string {
  const next = toDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return toText(next);
}

export type DatePeriod = {
  /** First day, inclusive. */
  start: string;
  /** Last day, inclusive. */
  end: string;
};

/**
 * The financial month containing `date`, for months that start on
 * `startDay` (1–28): with 25, 2026-11-05 is in 2026-10-25 … 2026-11-24.
 */
export function financialMonth(date: string, startDay: number): DatePeriod {
  const day = toDate(date);
  const year = day.getUTCFullYear();
  const month = day.getUTCMonth() - (day.getUTCDate() < startDay ? 1 : 0);
  const start = new Date(Date.UTC(year, month, startDay));
  const next = new Date(Date.UTC(year, month + 1, startDay));
  return { start: toText(start), end: addDays(toText(next), -1) };
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000);
}

/**
 * `date` moved by `months`, on `anchorDay` (default: the date's own day),
 * clamped to the month's length: 31 Jan + 1 month → 28 Feb; with anchor 31,
 * 28 Feb + 1 month → 31 Mar.
 */
export function addMonths(date: string, months: number, anchorDay?: number): string {
  const day = toDate(date);
  const year = day.getUTCFullYear();
  const month = day.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const wanted = anchorDay ?? day.getUTCDate();
  return toText(new Date(Date.UTC(year, month, Math.min(wanted, lastDay))));
}
