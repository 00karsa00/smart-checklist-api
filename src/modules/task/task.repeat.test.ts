import { describe, expect, it } from "vitest";

import { nextDueDate, nextOccurrence, RepeatRule } from "./task.repeat";

const rule = (parts: Partial<RepeatRule>): RepeatRule => ({
  frequency: "daily",
  interval: 1,
  ...parts,
});

// 2026-11-12 is a Thursday (4).
describe("nextOccurrence", () => {
  it("steps days and weeks", () => {
    expect(nextOccurrence(rule({}), "2026-11-12")).toBe("2026-11-13");
    expect(nextOccurrence(rule({ interval: 3 }), "2026-11-30")).toBe("2026-12-03");
    expect(nextOccurrence(rule({ frequency: "weekly" }), "2026-11-12")).toBe("2026-11-19");
    expect(nextOccurrence(rule({ frequency: "weekly", interval: 2 }), "2026-11-12")).toBe(
      "2026-11-26",
    );
  });

  it("goes to the next chosen weekday, then on to the next week", () => {
    const monThu = rule({ frequency: "weekly", weekdays: [1, 4] });
    expect(nextOccurrence(monThu, "2026-11-09")).toBe("2026-11-12"); // Mon → Thu
    expect(nextOccurrence(monThu, "2026-11-12")).toBe("2026-11-16"); // Thu → next Mon
    const everyOtherMonThu = rule({ frequency: "weekly", interval: 2, weekdays: [1, 4] });
    expect(nextOccurrence(everyOtherMonThu, "2026-11-12")).toBe("2026-11-23");
    expect(nextOccurrence(everyOtherMonThu, "2026-11-09")).toBe("2026-11-12");
  });

  it("keeps a month's day, shortening it only for short months", () => {
    const on31 = rule({ frequency: "monthly", anchorDay: 31 });
    expect(nextOccurrence(on31, "2026-01-31")).toBe("2026-02-28");
    expect(nextOccurrence(on31, "2026-02-28")).toBe("2026-03-31");
    expect(
      nextOccurrence(rule({ frequency: "monthly", interval: 3, anchorDay: 15 }), "2026-11-15"),
    ).toBe("2027-02-15");
    expect(nextOccurrence(rule({ frequency: "yearly", anchorDay: 29 }), "2028-02-29")).toBe(
      "2029-02-28",
    );
  });
});

describe("nextDueDate", () => {
  it("is the next date, or today or later when finished late", () => {
    expect(nextDueDate(rule({}), "2026-11-12", "2026-11-12")).toBe("2026-11-13");
    expect(nextDueDate(rule({}), "2026-11-01", "2026-11-12")).toBe("2026-11-12");
    expect(nextDueDate(rule({ frequency: "weekly" }), "2026-10-01", "2026-11-12")).toBe(
      "2026-11-12",
    );
    // Finished early: still the next one after its due date.
    expect(nextDueDate(rule({ frequency: "weekly" }), "2026-11-20", "2026-11-12")).toBe(
      "2026-11-27",
    );
  });
});
