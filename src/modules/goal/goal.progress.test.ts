import { describe, expect, it } from "vitest";

import { goalOverdue, goalProgress } from "./goal.progress";

const count = (done: number, total: number) => ({ done, total });

describe("goalProgress", () => {
  it("counts milestones and linked tasks together, rounding down", () => {
    expect(goalProgress("active", count(0, 0), count(0, 0))).toBe(0);
    expect(goalProgress("active", count(1, 4), count(0, 0))).toBe(25);
    expect(goalProgress("active", count(1, 2), count(3, 4))).toBe(66);
    expect(goalProgress("active", count(2, 2), count(4, 4))).toBe(100);
    expect(goalProgress("dropped", count(1, 2), count(0, 0))).toBe(50);
  });

  it("is 100 once achieved, whatever is left", () => {
    expect(goalProgress("achieved", count(0, 3), count(1, 9))).toBe(100);
  });
});

describe("goalOverdue", () => {
  it("is an active goal past its target date", () => {
    const today = "2026-11-12";
    expect(goalOverdue({ status: "active", targetDate: "2026-11-11" }, today)).toBe(true);
    expect(goalOverdue({ status: "active", targetDate: "2026-11-12" }, today)).toBe(false);
    expect(goalOverdue({ status: "achieved", targetDate: "2026-01-01" }, today)).toBe(false);
    expect(goalOverdue({ status: "active", targetDate: null }, today)).toBe(false);
  });
});
