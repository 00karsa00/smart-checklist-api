import { describe, expect, it } from "vitest";

import { assignDefined } from "./assign-defined";

describe("assignDefined", () => {
  it("copies only listed fields that were sent, including null", () => {
    const target = { name: "old", note: "keep" as string | null, bank: "A" };

    assignDefined(target, { name: "new", note: null, bank: undefined }, ["name", "note", "bank"]);

    expect(target).toEqual({ name: "new", note: null, bank: "A" });
  });

  it("ignores fields that are not listed", () => {
    const target = { name: "old", secret: "keep" };
    const sent = { name: "new", secret: "changed" };

    assignDefined(target, sent, ["name"]);

    expect(target).toEqual({ name: "new", secret: "keep" });
  });
});
