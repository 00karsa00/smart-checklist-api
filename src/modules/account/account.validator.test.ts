import { describe, expect, it } from "vitest";

import { fakeContext } from "../../test/fake-context";
import {
  validateAccountIdParam,
  validateAccountListQuery,
  validateCreateAccount,
  validateUpdateAccount,
} from "./account.validator";

const validAccount = { accountName: "Salary", bank: "HDFC", type: "saving" };

describe("validateCreateAccount", () => {
  it("accepts a minimal account and normalises ifsc", () => {
    const ctx = fakeContext({ body: { ...validAccount, ifsc: " hdfc0000260 " } });

    validateCreateAccount(ctx);

    expect(ctx.body.ifsc).toBe("HDFC0000260");
  });

  it("refuses ownership fields from the client", () => {
    expect(() =>
      validateCreateAccount(fakeContext({ body: { ...validAccount, userId: "x" } })),
    ).toThrow("Field 'userId' cannot be set by the client.");
  });

  it("reports an invalid type with its own error code", () => {
    expect(() =>
      validateCreateAccount(fakeContext({ body: { ...validAccount, type: "gold" } })),
    ).toThrow(expect.objectContaining({ code: "INVALID_ACCOUNT_TYPE", statusCode: 400 }));
  });

  it("refuses a negative opening balance", () => {
    expect(() =>
      validateCreateAccount(fakeContext({ body: { ...validAccount, currentBalance: -1 } })),
    ).toThrow("Field 'currentBalance' must be a non-negative number.");
  });

  it("handles a missing body", () => {
    expect(() => validateCreateAccount(fakeContext())).toThrow(
      "Field 'accountName' is required and must be a non-empty string.",
    );
  });
});

describe("validateUpdateAccount", () => {
  it("needs at least one field", () => {
    expect(() => validateUpdateAccount(fakeContext({ body: {} }))).toThrow(
      "Request body must include at least one of: 'accountName', 'bank', 'accountNumber', 'customerNumber', 'ifsc', 'type', 'status', 'openingDate', 'closingDate'.",
    );
  });

  it("never lets the balance be edited", () => {
    expect(() => validateUpdateAccount(fakeContext({ body: { currentBalance: 5 } }))).toThrow(
      "Field 'currentBalance' cannot be updated through this endpoint.",
    );
  });

  it("refuses an opening date after the closing date", () => {
    expect(() =>
      validateUpdateAccount(
        fakeContext({ body: { openingDate: "2024-05-01", closingDate: "2024-01-01" } }),
      ),
    ).toThrow("Field 'openingDate' must not be after 'closingDate'.");
  });
});

describe("validateAccountIdParam", () => {
  it("requires a UUID", () => {
    expect(() => validateAccountIdParam(fakeContext({ params: { id: "abc" } }))).toThrow(
      "Account id must be a valid UUID.",
    );
  });
});

describe("validateAccountListQuery", () => {
  it("checks paging and enum filters", () => {
    expect(() => validateAccountListQuery(fakeContext({ query: { limit: "500" } }))).toThrow(
      "Query param 'limit' must be an integer between 1 and 100.",
    );
    expect(() => validateAccountListQuery(fakeContext({ query: { status: "zzz" } }))).toThrow(
      "Query param 'status' must be one of: active, inactive, closed.",
    );
    expect(() =>
      validateAccountListQuery(fakeContext({ query: { status: "active", search: "x" } })),
    ).not.toThrow();
  });
});
