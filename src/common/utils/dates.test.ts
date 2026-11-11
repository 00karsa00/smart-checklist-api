import { describe, expect, it } from "vitest";

import { addDays, financialMonth, todayIn } from "./dates";

describe("financialMonth", () => {
  it.each([
    ["2026-11-05", 1, "2026-11-01", "2026-11-30"],
    ["2026-11-05", 25, "2026-10-25", "2026-11-24"],
    ["2026-11-25", 25, "2026-11-25", "2026-12-24"],
    ["2026-01-10", 25, "2025-12-25", "2026-01-24"],
    ["2026-12-31", 1, "2026-12-01", "2026-12-31"],
    ["2028-02-29", 1, "2028-02-01", "2028-02-29"],
    ["2026-03-01", 28, "2026-02-28", "2026-03-27"],
  ])("%s with start day %i → %s … %s", (date, startDay, start, end) => {
    expect(financialMonth(date, startDay)).toEqual({ start, end });
  });
});

describe("addDays", () => {
  it("crosses months and years", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("todayIn", () => {
  it("uses the time zone's calendar day", () => {
    const lateUtc = new Date("2026-11-05T20:00:00Z");
    expect(todayIn("UTC", lateUtc)).toBe("2026-11-05");
    expect(todayIn("Asia/Kolkata", lateUtc)).toBe("2026-11-06");
    expect(todayIn("America/New_York", new Date("2026-11-06T03:00:00Z"))).toBe("2026-11-05");
  });
});
