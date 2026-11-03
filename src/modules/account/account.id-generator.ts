// ── Account ID generator ──────────────────────────────────────────────────────
//
// Produces per-user, human-friendly account identifiers in the form:
//   ACC000001, ACC000002, ...
//
// The numeric part is derived from the highest existing account_id for the
// given user, so numbering is contiguous and does not collide. Uniqueness is
// ultimately guaranteed by the (user_id, account_id) UNIQUE index — the service
// retries on the rare race where two creates pick the same next number.

import { padSequence } from "../../common/utils/reference-code";

export const ACCOUNT_ID_PREFIX = "ACC";
export const ACCOUNT_ID_PAD_LENGTH = 6;

/** Format a numeric sequence into an account id, e.g. 1 -> "ACC000001". */
export function formatAccountId(sequence: number): string {
  return `${ACCOUNT_ID_PREFIX}${padSequence(sequence, ACCOUNT_ID_PAD_LENGTH)}`;
}

/** Parse the numeric sequence out of an account id, or 0 if it doesn't match. */
export function parseAccountIdSequence(accountId: string | null | undefined): number {
  if (!accountId) return 0;
  const match = new RegExp(`^${ACCOUNT_ID_PREFIX}(\\d+)$`).exec(accountId);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Given the current highest account id for a user (or null when the user has no
 * accounts yet), return the next account id in sequence.
 */
export function nextAccountId(currentMax: string | null | undefined): string {
  return formatAccountId(parseAccountIdSequence(currentMax) + 1);
}
