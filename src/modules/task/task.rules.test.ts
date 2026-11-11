import { describe, expect, it } from "vitest";

import { dueRange, isOverdue, priorityFromNumber, priorityToNumber } from "./task.rules";

const now = { date: "2026-11-12", time: "14:30" };
const task = (dueDate: string | null, dueTime: string | null = null, status = "todo") => ({
  status,
  dueDate,
  dueTime,
});

describe("isOverdue", () => {
  it("is past the due date, or today past the due time, and not done", () => {
    expect(isOverdue(task("2026-11-11"), now)).toBe(true);
    expect(isOverdue(task("2026-11-12"), now)).toBe(false);
    expect(isOverdue(task("2026-11-12", "14:00"), now)).toBe(true);
    expect(isOverdue(task("2026-11-12", "15:00"), now)).toBe(false);
    expect(isOverdue(task("2026-11-13", "09:00"), now)).toBe(false);
    expect(isOverdue(task("2026-11-01", null, "done"), now)).toBe(false);
    expect(isOverdue(task(null), now)).toBe(false);
  });
});

describe("dueRange", () => {
  it("turns each filter into dates", () => {
    expect(dueRange("today", "2026-11-12")).toEqual({ from: "2026-11-12", to: "2026-11-12" });
    expect(dueRange("overdue", "2026-11-12")).toEqual({ to: "2026-11-11" });
    expect(dueRange("upcoming", "2026-11-12")).toEqual({ from: "2026-11-13", to: "2026-11-19" });
    expect(dueRange("none", "2026-11-12")).toBeNull();
  });
});

describe("priority", () => {
  it("is stored as a number and read back", () => {
    expect(priorityToNumber("high")).toBe(3);
    expect(priorityFromNumber(2)).toBe("medium");
    expect(priorityFromNumber(9)).toBe("none");
  });
});
