import { describe, expect, it } from "vitest";

import { parseCsv, parseCsvLines, toCsv } from "./csv";

describe("parseCsv", () => {
  it("reads quoted cells, doubled quotes, line breaks in quotes, CRLF and a BOM", () => {
    const text =
      '\uFEFFDate,Narration,Amount\r\n01/11/2026,"UPI, Swiggy ""food""",-450.00\r\n02/11/2026,"Line one\nline two",100\r\n';
    expect(parseCsv(text)).toEqual([
      ["Date", "Narration", "Amount"],
      ["01/11/2026", 'UPI, Swiggy "food"', "-450.00"],
      ["02/11/2026", "Line one\nline two", "100"],
    ]);
  });

  it("finds semicolon and tab separators, skips blank lines, keeps empty cells", () => {
    expect(parseCsv("a;b;c\n\n1;;3")).toEqual([
      ["a", "b", "c"],
      ["1", "", "3"],
    ]);
    expect(parseCsv("a\tb\n1\t2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("reads a last line without a line end", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("parseCsvLines", () => {
  it("gives the line each row starts on, counting blank lines and line breaks in quotes", () => {
    const rows = parseCsvLines('a,b\r\n\r\n"x\ny",1\r\nlast,2');
    expect(rows.map((row) => row.line)).toEqual([1, 3, 5]);
  });
});

describe("toCsv", () => {
  it("quotes when needed and round-trips", () => {
    const rows = [
      ["Payee", "Amount"],
      ['Big "B", Chennai', 12.5],
      ["Line\nbreak", null],
    ];
    const text = toCsv(rows);
    expect(text).toBe('Payee,Amount\r\n"Big ""B"", Chennai",12.5\r\n"Line\nbreak",\r\n');
    expect(parseCsv(text)).toEqual([
      ["Payee", "Amount"],
      ['Big "B", Chennai', "12.5"],
      ["Line\nbreak", ""],
    ]);
  });

  it("stops spreadsheet formulas in text but not negative numbers, and reads them back", () => {
    const text = toCsv([["=HYPERLINK(1)", "+1", "@x", -450]]);
    expect(text).toBe("'=HYPERLINK(1),'+1,'@x,-450\r\n");
    expect(parseCsv(text)).toEqual([["=HYPERLINK(1)", "+1", "@x", "-450"]]);
  });
});
