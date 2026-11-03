import {
  assertPageQuery,
  isDate,
  isNonEmptyString,
  isPositiveNumber,
  isUuid,
  validationError,
} from "../../common/validation/rules";
import { Guard } from "../../infrastructure/http";

/** Optional free-text fields shared by create and update. */
function assertOptionalTexts(body: Record<string, unknown>): void {
  for (const field of ["paymentMethod", "remarks", "note"]) {
    if (body[field] !== undefined && !isNonEmptyString(body[field])) {
      throw validationError(`Field '${field}' must be a non-empty string.`);
    }
  }
}

// ── Params ────────────────────────────────────────────────────────────────────

export const validateTransactionIdParam: Guard = (ctx) => {
  const { id } = ctx.params;

  if (!id) throw validationError("Transaction id is required.");
  if (!isUuid(id)) throw validationError("Transaction id must be a valid UUID.");
};

// ── Query ─────────────────────────────────────────────────────────────────────

export const validateTransactionListQuery: Guard = (ctx) => {
  const { accountId, transactionTypeId, startDate, endDate } = ctx.query as Record<
    string,
    string | undefined
  >;

  assertPageQuery(ctx.query);

  if (accountId !== undefined && !isUuid(accountId)) {
    throw validationError("Query param 'accountId' must be a valid UUID.");
  }

  if (transactionTypeId !== undefined && !isUuid(transactionTypeId)) {
    throw validationError("Query param 'transactionTypeId' must be a valid UUID.");
  }

  if (startDate !== undefined && !isDate(startDate)) {
    throw validationError("Query param 'startDate' must be a valid date in YYYY-MM-DD format.");
  }

  if (endDate !== undefined && !isDate(endDate)) {
    throw validationError("Query param 'endDate' must be a valid date in YYYY-MM-DD format.");
  }

  if (startDate && endDate && startDate > endDate) {
    throw validationError("Query param 'startDate' must not be after 'endDate'.");
  }
};

// ── Body ──────────────────────────────────────────────────────────────────────

export const validateCreateTransaction: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Record<string, unknown>;
  const { transactionDate, accountId, transactionTypeId, amount } = body;

  if (!isDate(transactionDate)) {
    throw validationError(
      "Field 'transactionDate' is required and must be a valid date in YYYY-MM-DD format.",
    );
  }

  if (!isUuid(accountId)) {
    throw validationError("Field 'accountId' is required and must be a valid UUID.");
  }

  if (!isUuid(transactionTypeId)) {
    throw validationError("Field 'transactionTypeId' is required and must be a valid UUID.");
  }

  if (!isPositiveNumber(amount)) {
    throw validationError("Field 'amount' is required and must be a positive number.");
  }

  assertOptionalTexts(body);
};

const UPDATABLE_FIELDS = [
  "transactionDate",
  "accountId",
  "transactionTypeId",
  "amount",
  "paymentMethod",
  "remarks",
  "note",
] as const;

export const validateUpdateTransaction: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Record<string, unknown>;
  const { transactionDate, accountId, transactionTypeId, amount } = body;

  if (!UPDATABLE_FIELDS.some((field) => body[field] !== undefined)) {
    throw validationError(
      `Request body must include at least one of: ${UPDATABLE_FIELDS.map((f) => `'${f}'`).join(", ")}.`,
    );
  }

  if (transactionDate !== undefined && !isDate(transactionDate)) {
    throw validationError("Field 'transactionDate' must be a valid date in YYYY-MM-DD format.");
  }

  if (accountId !== undefined && !isUuid(accountId)) {
    throw validationError("Field 'accountId' must be a valid UUID.");
  }

  if (transactionTypeId !== undefined && !isUuid(transactionTypeId)) {
    throw validationError("Field 'transactionTypeId' must be a valid UUID.");
  }

  if (amount !== undefined && !isPositiveNumber(amount)) {
    throw validationError("Field 'amount' must be a positive number.");
  }

  assertOptionalTexts(body);
};
