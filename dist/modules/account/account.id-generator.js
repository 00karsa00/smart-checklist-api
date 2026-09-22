"use strict";
// ── Account ID generator ──────────────────────────────────────────────────────
//
// Produces per-user, human-friendly account identifiers in the form:
//   ACC000001, ACC000002, ...
//
// The numeric part is derived from the highest existing account_id for the
// given user, so numbering is contiguous and does not collide. Uniqueness is
// ultimately guaranteed by the (user_id, account_id) UNIQUE index — the service
// retries on the rare race where two creates pick the same next number.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACCOUNT_ID_PAD_LENGTH = exports.ACCOUNT_ID_PREFIX = void 0;
exports.formatAccountId = formatAccountId;
exports.parseAccountIdSequence = parseAccountIdSequence;
exports.nextAccountId = nextAccountId;
exports.ACCOUNT_ID_PREFIX = "ACC";
exports.ACCOUNT_ID_PAD_LENGTH = 6;
/** Format a numeric sequence into an account id, e.g. 1 -> "ACC000001". */
function formatAccountId(sequence) {
    return `${exports.ACCOUNT_ID_PREFIX}${String(sequence).padStart(exports.ACCOUNT_ID_PAD_LENGTH, "0")}`;
}
/** Parse the numeric sequence out of an account id, or 0 if it doesn't match. */
function parseAccountIdSequence(accountId) {
    if (!accountId)
        return 0;
    const match = new RegExp(`^${exports.ACCOUNT_ID_PREFIX}(\\d+)$`).exec(accountId);
    return match ? parseInt(match[1], 10) : 0;
}
/**
 * Given the current highest account id for a user (or null when the user has no
 * accounts yet), return the next account id in sequence.
 */
function nextAccountId(currentMax) {
    return formatAccountId(parseAccountIdSequence(currentMax) + 1);
}
//# sourceMappingURL=account.id-generator.js.map