import { MonthCount } from "./types/system.type";

/** The `count` months ending with the one containing `today` (YYYY-MM-DD), as YYYY-MM, oldest first. */
export function lastMonths(today: string, count: number): string[] {
  const [year, month] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (count - 1 - index), 1));
    return date.toISOString().slice(0, 7);
  });
}

/** A count for every month, 0 where there is none. */
export function fillMonths(months: readonly string[], counts: readonly MonthCount[]): MonthCount[] {
  const byMonth = new Map(counts.map((item) => [item.month, item.count]));
  return months.map((month) => ({ month, count: byMonth.get(month) ?? 0 }));
}
