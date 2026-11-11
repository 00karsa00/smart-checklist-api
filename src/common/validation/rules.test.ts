import { describe, expect, it } from "vitest";

import { isTimeZone } from "./rules";

describe("isTimeZone", () => {
  it("accepts zone names, old and new spellings", () => {
    for (const zone of [
      "Asia/Kolkata",
      "Asia/Calcutta",
      "UTC",
      "America/New_York",
      "America/Argentina/Buenos_Aires",
      "Etc/GMT+5",
    ]) {
      expect(isTimeZone(zone), zone).toBe(true);
    }
  });

  it("refuses what is not a zone name", () => {
    for (const zone of ["Mars/Base", "+05:30", "", "Asia/Kolkata ", 42, null]) {
      expect(isTimeZone(zone), String(zone)).toBe(false);
    }
  });
});
