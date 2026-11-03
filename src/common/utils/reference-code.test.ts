import { describe, expect, it } from "vitest";

import {
  formatBorrowLendReference,
  formatExpenseReference,
  formatIncomeReference,
  formatTransactionReference,
  monthLetter,
  parseReferenceSequence,
} from "./reference-code";

const date = new Date(Date.UTC(2026, 4, 7)); // 7 May 2026

describe("reference codes", () => {
  it("match the spreadsheet formats", () => {
    expect(formatTransactionReference(date, 3)).toBe("TRAN-07052026-003");
    expect(formatIncomeReference(date, 12)).toBe("INC2026MY-012");
    expect(formatExpenseReference(date, 1)).toBe("EXP2026MY-001");
    expect(formatBorrowLendReference(date, 7)).toBe("BL-07052026-007");
  });

  it("uses the sheet's month letters", () => {
    expect(monthLetter(new Date(Date.UTC(2026, 0, 1)))).toBe("J");
    expect(monthLetter(new Date(Date.UTC(2026, 6, 1)))).toBe("JL");
  });

  it("reads the trailing sequence", () => {
    expect(parseReferenceSequence("TRAN-07052026-041")).toBe(41);
    expect(parseReferenceSequence("nothing")).toBe(0);
    expect(parseReferenceSequence(undefined)).toBe(0);
  });
});
