import { describe, expect, it } from "vitest";

import { changesBetween } from "./audit.changes";

describe("changesBetween", () => {
  it("lists only the fields that changed, with both values", () => {
    const before = { name: "Asha", role: "viewer", isActive: true, updatedAt: 1 };
    const after = { name: "Asha", role: "admin", isActive: false, updatedAt: 2 };
    expect(changesBetween(before, after, ["name", "role", "isActive"])).toEqual({
      role: { from: "viewer", to: "admin" },
      isActive: { from: true, to: false },
    });
  });

  it("is empty when nothing listed changed", () => {
    expect(changesBetween({ a: 1, b: 1 }, { a: 1, b: 2 }, ["a"])).toEqual({});
  });
});
