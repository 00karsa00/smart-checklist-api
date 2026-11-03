import { describe, expect, it } from "vitest";

import { formatAccountId, nextAccountId, parseAccountIdSequence } from "./account.id-generator";

describe("account ids", () => {
  it("formats with a padded sequence", () => {
    expect(formatAccountId(1)).toBe("ACC000001");
    expect(formatAccountId(1234567)).toBe("ACC1234567");
  });

  it("parses the sequence back, or 0 when it does not match", () => {
    expect(parseAccountIdSequence("ACC000042")).toBe(42);
    expect(parseAccountIdSequence("XYZ1")).toBe(0);
    expect(parseAccountIdSequence(null)).toBe(0);
  });

  it("continues from the highest existing id", () => {
    expect(nextAccountId(null)).toBe("ACC000001");
    expect(nextAccountId("ACC000009")).toBe("ACC000010");
  });
});
