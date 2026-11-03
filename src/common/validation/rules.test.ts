import { describe, expect, it } from "vitest";

import { fakeContext } from "../../test/fake-context";
import {
  assertAtLeastOne,
  assertOptional,
  assertPageQuery,
  idParamGuard,
  isDate,
  isEmail,
  isNonEmptyString,
  isOneOf,
  isUuid,
  isUuidV4,
  orNull,
  rejectFields,
} from "./rules";

describe("validation rules", () => {
  it("checks UUIDs", () => {
    expect(isUuid("4b2c77c8-e65b-4232-a395-57bce4f05b86")).toBe(true);
    expect(isUuid("4b2c77c8-e65b-1232-a395-57bce4f05b86")).toBe(true);
    expect(isUuidV4("4b2c77c8-e65b-1232-a395-57bce4f05b86")).toBe(false);
    expect(isUuid("abc")).toBe(false);
  });

  it("only accepts real YYYY-MM-DD dates", () => {
    expect(isDate("2024-02-29")).toBe(true);
    expect(isDate("2024-13-01")).toBe(false);
    expect(isDate("01-02-2024")).toBe(false);
    expect(isDate(20240101)).toBe(false);
  });

  it("checks emails and allowed values", () => {
    expect(isEmail("a@b.co")).toBe(true);
    expect(isEmail("nope")).toBe(false);
    expect(isOneOf("saving", ["saving", "current"])).toBe(true);
    expect(isOneOf(1, ["1"])).toBe(false);
  });

  it("validates page and limit", () => {
    expect(() => assertPageQuery({ page: "2", limit: "100" })).not.toThrow();
    expect(() => assertPageQuery({ page: "0" })).toThrow(
      "Query param 'page' must be a positive integer.",
    );
    expect(() => assertPageQuery({ limit: "101" })).toThrow(
      "Query param 'limit' must be an integer between 1 and 100.",
    );
  });
});

describe("shared validators", () => {
  it("idParamGuard names the entity in its messages", () => {
    const guard = idParamGuard("Account");

    expect(() => guard(fakeContext({ params: { id: "" } }))).toThrow("Account id is required.");
    expect(() => guard(fakeContext({ params: { id: "abc" } }))).toThrow(
      "Account id must be a valid UUID.",
    );
    expect(() =>
      guard(fakeContext({ params: { id: "4b2c77c8-e65b-4232-a395-57bce4f05b86" } })),
    ).not.toThrow();
  });

  it("assertAtLeastOne lists the accepted fields", () => {
    expect(() => assertAtLeastOne({}, ["name", "email"])).toThrow(
      "Request body must include at least one of: 'name', 'email'.",
    );
    expect(() => assertAtLeastOne({ email: "a@b.co" }, ["name", "email"])).not.toThrow();
  });

  it("rejectFields reports the first forbidden field", () => {
    expect(() =>
      rejectFields({ userId: "x", id: "y" }, ["id", "userId"], (f) => `No '${f}'.`),
    ).toThrow("No 'id'.");
  });

  it("assertOptional only checks fields that were sent", () => {
    expect(() => assertOptional({}, "note", isNonEmptyString, "Bad note.")).not.toThrow();
    expect(() => assertOptional({ note: "" }, "note", isNonEmptyString, "Bad note.")).toThrow(
      "Bad note.",
    );
    expect(() =>
      assertOptional({ note: null }, "note", orNull(isNonEmptyString), "Bad note."),
    ).not.toThrow();
  });
});
