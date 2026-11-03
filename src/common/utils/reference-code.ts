// ── Reference-code generators ─────────────────────────────────────────────────
//
// Reproduces the human-friendly identifiers the Google Sheet built with
// formulas, so the web app keeps the same id conventions:
//
//   All Transactions : "TRAN-DDMMYYYY-000"   (per-day sequence)
//     e.g. =IF(B2="","", "TRAN-"&TEXT(B2,"DDMMYYYY")&"-"&TEXT(COUNTIFS(...),"000"))
//
//   Incomes          : "INC{YYYY}{Mletter}-000"  (per-month sequence)
//   Expenses         : "EXP{YYYY}{Mletter}-000"  (per-month sequence)
//     e.g. ="INC"&YEAR(B2)&CHOOSE(MONTH(B2),"J",...,"D")&"-"&TEXT(seq,"000")
//
//   BorrowLend       : "BL-DDMMYYYY-000"       (per-day sequence)
//
// The numeric suffix (sequence) is supplied by the caller, derived from a count
// of existing rows in the same day/month bucket (see the module services). These
// helpers are pure: they only format, so they are trivially testable.

const SEQ_PAD_LENGTH = 3;

/**
 * Single-letter month codes used by the sheet's income/expense ids, matching
 * CHOOSE(MONTH(date),"J","F","M","A","MY","JU","JL","AU","S","O","N","D").
 * Index 0 is January.
 */
export const MONTH_LETTERS = [
  "J", // Jan
  "F", // Feb
  "M", // Mar
  "A", // Apr
  "MY", // May
  "JU", // Jun
  "JL", // Jul
  "AU", // Aug
  "S", // Sep
  "O", // Oct
  "N", // Nov
  "D", // Dec
] as const;

function pad(sequence: number): string {
  return String(sequence).padStart(SEQ_PAD_LENGTH, "0");
}

/** Format a date as DDMMYYYY (matches the sheet's TEXT(date,"DDMMYYYY")). */
export function formatDDMMYYYY(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getUTCFullYear());
  return `${dd}${mm}${yyyy}`;
}

/** Month letter code for a date, e.g. April -> "A", May -> "MY". */
export function monthLetter(date: Date): string {
  return MONTH_LETTERS[date.getUTCMonth()];
}

/** Parse the trailing numeric sequence from a reference code, or 0. */
export function parseReferenceSequence(code: string | null | undefined): number {
  if (!code) return 0;
  const match = /-(\d+)$/.exec(code);
  return match ? parseInt(match[1], 10) : 0;
}

/** "TRAN-DDMMYYYY-000" for a given date + per-day sequence. */
export function formatTransactionReference(date: Date, sequence: number): string {
  return `TRAN-${formatDDMMYYYY(date)}-${pad(sequence)}`;
}

/** "INC{YYYY}{Mletter}-000" for a given date + per-month sequence. */
export function formatIncomeReference(date: Date, sequence: number): string {
  return `INC${date.getUTCFullYear()}${monthLetter(date)}-${pad(sequence)}`;
}

/** "EXP{YYYY}{Mletter}-000" for a given date + per-month sequence. */
export function formatExpenseReference(date: Date, sequence: number): string {
  return `EXP${date.getUTCFullYear()}${monthLetter(date)}-${pad(sequence)}`;
}

/** "BL-DDMMYYYY-000" for a given date + per-day sequence. */
export function formatBorrowLendReference(date: Date, sequence: number): string {
  return `BL-${formatDDMMYYYY(date)}-${pad(sequence)}`;
}
