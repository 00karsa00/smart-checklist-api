import {
  assertAtLeastOne,
  assertOptional,
  assertPageQuery,
  idParamGuard,
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
    assertOptional(body, field, isNonEmptyString, `Field '${field}' must be a non-empty string.`);
  }
}

// ── Params ────────────────────────────────────────────────────────────────────

export const validateTransactionIdParam = idParamGuard("Transaction");

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

  assertAtLeastOne(body, UPDATABLE_FIELDS);

  assertOptional(
    body,
    "transactionDate",
    isDate,
    "Field 'transactionDate' must be a valid date in YYYY-MM-DD format.",
  );
  assertOptional(body, "accountId", isUuid, "Field 'accountId' must be a valid UUID.");
  assertOptional(
    body,
    "transactionTypeId",
    isUuid,
    "Field 'transactionTypeId' must be a valid UUID.",
  );
  assertOptional(body, "amount", isPositiveNumber, "Field 'amount' must be a positive number.");
  assertOptionalTexts(body);
};
