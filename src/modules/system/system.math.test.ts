import { describe, expect, it } from "vitest";

import { fillMonths, lastMonths } from "./system.math";

describe("lastMonths", () => {
  it("ends with this month and crosses years", () => {
    expect(lastMonths("2026-02-15", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

describe("fillMonths", () => {
  it("puts 0 in months without a count and drops others", () => {
    expect(
      fillMonths(
        ["2026-01", "2026-02"],
        [
          { month: "2026-02", count: 3 },
          { month: "2025-01", count: 9 },
        ],
      ),
    ).toEqual([
      { month: "2026-01", count: 0 },
      { month: "2026-02", count: 3 },
    ]);
  });
});
